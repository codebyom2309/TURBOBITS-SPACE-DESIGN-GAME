"""Mission Architect web server: serves the game (web/) and a TiDB-backed JSON API.

Run: python server.py  ->  http://localhost:8600
"""
from __future__ import annotations

import json
import math
import os
import random
from http.server import BaseHTTPRequestHandler, SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import time
from urllib.parse import parse_qs, urlparse

from engine import career_db as CAREER
from engine import catalog as C
from engine import db
from engine import designs as DESIGNS
from engine import leaderboard as LB
from engine import users as USERS
from engine.mentor import DEFAULT_GROQ_MODEL, get_groq_config, handle_mission_assistant_request
from engine.model import blank_design, default_design, evaluate, normalize
from engine.rooms import FIELD_OWNER, RoomStore
from engine.scoring import score
from engine.simulate import monte_carlo, simulate

WEB = Path(__file__).resolve().parent / "web"
_ENV_FILE = Path(__file__).resolve().parent / ".env"
if _ENV_FILE.exists():
    try:
        for _line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
            _s = _line.strip()
            if _s and not _s.startswith("#") and "=" in _s:
                _k, _v = _s.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
    except Exception:
        pass

ROOMS = RoomStore()
_INIT_LOCK = threading.Lock()
_INIT_DONE = False


def ensure_db_init() -> None:
    """Idempotently initialize database schema once per process."""
    global _INIT_DONE
    if _INIT_DONE:
        return
    with _INIT_LOCK:
        if _INIT_DONE:
            return
        try:
            db.init_db()
            _INIT_DONE = True
        except Exception as e:
            print(f"Warning: TiDB initialization failed/deferred: {e}")


def clean(o):
    """JSON-safe: inf/nan -> None, tuples -> lists."""
    if isinstance(o, float):
        return o if math.isfinite(o) else None
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    return o


def catalog() -> dict:
    return {k: getattr(C, k) for k in ("DESTINATIONS", "SCENARIOS", "ORBITS", "LAUNCH_VEHICLES", "LV_TARGET_LABEL",
                                        "BUSES", "SOLAR_ARRAYS", "RTG", "BATTERIES", "COMMS", "GROUND", "COMPUTERS",
                                        "ADCS", "PROPULSION", "INSTRUMENTS", "DIFFICULTY", "ROLES", "RADIATION_LABEL", "EDL", "PARTNERS", "MAX_PARTNERS", "PAYLOADS", "CREW_RATED", "SUPPLY_KG_PER_CREW_MONTH", "EXISTING", "VEHICLE")} | {
        "FIELD_OWNER": FIELD_OWNER,
        "DEFAULTS": {s: default_design(s) for s in C.SCENARIOS},
        "BLANK": {s: blank_design(s) for s in C.SCENARIOS},
    }


def launch(body: dict, user_id: int | None = None) -> dict:
    design = normalize(body.get("design", {}))
    seed = int(body.get("seed") or random.randint(1, 999_999))
    ev = evaluate(design)
    sim = simulate(design, seed, ev)
    sc = score(sim)
    sim.pop("evaluation", None)
    res = {
        "name": str(body.get("name", "Unnamed mission"))[:40],
        "player": str(body.get("player", ""))[:20],
        "seed": seed,
        "design": design,
        "sim": sim,
        "score": sc,
        "evaluation": ev,
    }
    if sim["launched"] and not design["sandbox"] and body.get("save", True):
        LB.add({
            "name": res["name"],
            "player": res["player"] or "anonymous",
            "scenario": design["scenario"],
            "difficulty": design["difficulty"],
            "score": sc["total"],
            "grade": sc["grade"],
            "seed": seed,
            "design": design,
            "user_id": user_id,
        })
    return res


def room_view(code: str) -> dict:
    r = ROOMS.get(code)
    now = time.time()
    roster = {
        p: {
            "roles": list(i.get("roles", [])),
            "ready": bool(i.get("ready", False)),
            "avatar": str(i.get("avatar", "eng1")),
            "seen": float(i.get("seen", now)),
            "online": (now - float(i.get("seen", now))) < 35,
        }
        for p, i in r["players"].items()
    }
    return {
        "code": code,
        "meta": r.get("meta", {}),
        "design": r["design"],
        "version": r["version"],
        "approvals": r["approvals"],
        "players": {p: i["roles"] for p, i in r["players"].items()},
        "roster": roster,
        "chat": r["chat"][-40:],
        "last_run": r["last_run"],
        "evaluation": evaluate(r["design"]),
    }


class ApiHandlerMixin:
    def log_message(self, fmt, *args):  # quieter console
        if "/api/room/" not in getattr(self, "path", ""):
            super().log_message(fmt, *args)

    def _json(self, data, status=200):
        raw = json.dumps(clean(data)).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _body(self) -> dict:
        n = int(self.headers.get("Content-Length") or 0)
        if n > 500_000:
            raise ValueError("body too large")
        return json.loads(self.rfile.read(n) or b"{}")

    def _get_auth_user(self) -> dict | None:
        """Extract user session from Authorization header or cookie."""
        auth = self.headers.get("Authorization", "")
        token = None
        if auth.startswith("Bearer "):
            token = auth[7:].strip()
        elif "X-Session-Token" in self.headers:
            token = self.headers.get("X-Session-Token")
        else:
            cookie_header = self.headers.get("Cookie", "")
            for part in cookie_header.split(";"):
                if "=" in part:
                    k, v = part.strip().split("=", 1)
                    if k == "session_token":
                        token = v
                        break
        return USERS.get_session(token) if token else None

    def end_headers(self):
        req_path = getattr(self, "path", "").split("?", 1)[0]
        if req_path == "/sw.js":
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Service-Worker-Allowed", "/")
        elif not req_path.startswith("/api/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Allow", "GET, POST, DELETE, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def _handle_api_get(self) -> bool:
        ensure_db_init()
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        sess = self._get_auth_user()
        user_id = sess["user_id"] if sess else None

        try:
            if u.path == "/api/health":
                if not db.is_available():
                    self._json({"status": "ok", "tidb": None, "mode": "in-memory"})
                    return True
                try:
                    res = db.fetch_one("SELECT VERSION() as v, DATABASE() as db")
                    self._json({"status": "ok", "tidb": res, "mode": "tidb"})
                    return True
                except Exception as ex:
                    self._json({"status": "ok", "tidb": None, "mode": "in-memory", "warning": str(ex)})
                    return True

            if u.path == "/api/catalog":
                self._json(catalog())
                return True

            if u.path == "/api/ai/status":
                api_key, model_id = get_groq_config()
                has_key = bool(api_key)
                self._json({
                    "ok": True,
                    "configured": has_key,
                    "model": model_id,
                    "mode": "groq" if has_key else "deterministic_fallback",
                })
                return True

            if u.path == "/api/leaderboard":
                self._json(LB.top(q.get("scenario", "wildfire"), int(q.get("n", 10))))
                return True

            if u.path == "/api/auth/me":
                if sess:
                    self._json({"logged_in": True, "user": sess})
                    return True
                self._json({"logged_in": False, "user": None})
                return True

            if u.path == "/api/designs":
                player = q.get("player") or (sess["username"] if sess else "anonymous")
                designs = DESIGNS.list_designs(user_id=user_id, player_name=player)
                self._json(designs)
                return True

            if u.path == "/api/career":
                player = q.get("player") or (sess["username"] if sess else "anonymous")
                c_data = CAREER.get_career(user_id=user_id, player_name=player)
                self._json(c_data or {})
                return True

            if u.path.startswith("/api/room/"):
                code = u.path.rsplit("/", 1)[-1].upper()
                if not ROOMS.exists(code):
                    self._json({"error": "No room with that code."}, 404)
                    return True
                if q.get("player"):
                    ROOMS.touch(code, str(q.get("player"))[:20])
                if int(q.get("since", -1)) == ROOMS.version(code):
                    self._json({"unchanged": True, "version": ROOMS.version(code)})
                    return True
                self._json(room_view(code))
                return True

        except Exception as e:  # noqa: BLE001
            self._json({"error": str(e)}, 400)
            return True
        return False

    def do_GET(self):
        if not self._handle_api_get():
            return super().do_GET()

    def do_POST(self):
        ensure_db_init()
        u = urlparse(self.path)
        sess = self._get_auth_user()
        user_id = sess["user_id"] if sess else None

        try:
            b = self._body()

            # Auth endpoints
            if u.path == "/api/auth/register":
                res = USERS.register(b.get("username", ""), b.get("password", ""), b.get("display_name", ""))
                return self._json(res, 200 if res.get("ok") else 400)

            if u.path == "/api/auth/login":
                res = USERS.login(b.get("username", ""), b.get("password", ""))
                return self._json(res, 200 if res.get("ok") else 401)

            if u.path == "/api/auth/logout":
                token = b.get("token") or (self.headers.get("Authorization", "")[7:] if self.headers.get("Authorization", "").startswith("Bearer ") else None)
                USERS.logout(token)
                return self._json({"ok": True})

            # Designs endpoints
            if u.path == "/api/designs":
                player = str(b.get("player") or (sess["username"] if sess else "anonymous"))[:50]
                res = DESIGNS.save_design(
                    name=b.get("name", "Untitled"),
                    scenario=b.get("scenario", "wildfire"),
                    design=b.get("design", {}),
                    flight=b.get("flight"),
                    user_id=user_id,
                    player_name=player,
                )
                return self._json(res)

            if u.path == "/api/designs/delete":
                design_id = b.get("id")
                player = sess["username"] if sess else b.get("player")
                ok = DESIGNS.delete_design(design_id, user_id=user_id, player_name=player)
                return self._json({"ok": ok})

            # Career endpoint
            if u.path == "/api/career":
                player = str(b.get("player") or (sess["username"] if sess else "anonymous"))[:50]
                ok = CAREER.save_career(b.get("career", b), user_id=user_id, player_name=player)
                return self._json({"ok": ok})

            # Existing game endpoints
            if u.path == "/api/evaluate":
                return self._json(evaluate(b.get("design", {})))

            if u.path == "/api/ai/mission-assistant":
                status_code, resp_payload = handle_mission_assistant_request(b)
                return self._json(resp_payload, status_code)

            if u.path == "/api/risk":
                return self._json(monte_carlo(normalize(b.get("design", {})), 200))

            if u.path == "/api/launch":
                room = b.get("room")
                if room:
                    if not ROOMS.exists(room):
                        return self._json({"error": "No room with that code."}, 404)
                    if not ROOMS.all_approved(room):
                        return self._json({"error": "All four roles must approve first."}, 409)
                    b["design"] = ROOMS.get(room)["design"]
                res = launch(b, user_id=user_id)
                if room:
                    ROOMS.set_last_run(room, clean(res))
                return self._json(res)

            if u.path == "/api/room/create":
                host_player = str(b.get("player") or "anonymous")[:20]
                meta = {
                    "team_name": b.get("team_name") or "Horizon Engineering Unit",
                    "callsign": b.get("callsign") or "HZN-01",
                    "description": b.get("description") or "Horizon Coalition cooperative spacecraft engineering team.",
                    "emblem": b.get("emblem") or "horizon",
                    "collab_mode": b.get("collab_mode") or "role_strict",
                    "host": host_player,
                }
                code = ROOMS.create(b.get("scenario", "wildfire"), meta=meta)
                if b.get("design"):
                    ROOMS.replace_design(code, normalize(b["design"]))
                init_roles = [r for r in b.get("roles", []) if r in C.ROLES]
                ROOMS.join(code, host_player, init_roles, avatar=b.get("avatar"))
                return self._json(room_view(code))

            parts = u.path.strip("/").split("/")  # api/room/CODE/action
            if len(parts) == 4 and parts[1] == "room":
                code, action = parts[2].upper(), parts[3]
                if not ROOMS.exists(code):
                    return self._json({"error": "No room with that code."}, 404)
                p = str(b.get("player") or "anonymous")[:20]
                if action == "join":
                    roles = [r for r in b.get("roles", []) if r in C.ROLES]
                    taken = ROOMS.roles_taken(code, exclude=p)
                    if any(r in taken for r in roles):
                        return self._json({"error": "Role already taken."}, 409)
                    ROOMS.join(code, p, roles, avatar=b.get("avatar"), ready=b.get("ready"))
                elif action == "assign":
                    target = str(b.get("target") or p)[:20]
                    roles = [r for r in b.get("roles", []) if r in C.ROLES]
                    taken = ROOMS.roles_taken(code, exclude=target)
                    if any(r in taken for r in roles):
                        return self._json({"error": "Role already taken by another engineer."}, 409)
                    ROOMS.join(code, target, roles)
                elif action == "ready":
                    ROOMS.set_ready(code, p, bool(b.get("ready", True)))
                elif action == "kick":
                    target = str(b.get("target") or "")[:20]
                    if not ROOMS.kick(code, p, target):
                        return self._json({"error": "Only the room host can remove members."}, 403)
                elif action == "meta":
                    ROOMS.update_meta(code, p, b)
                elif action == "set":
                    if not ROOMS.set_field(code, p, b["field"], b["value"]):
                        return self._json({"error": "That belongs to another role."}, 403)
                elif action == "approve":
                    ROOMS.approve(code, p, b["role"], bool(b.get("value", True)))
                elif action == "say":
                    ROOMS.say(code, p, str(b.get("text", "")))
                return self._json(room_view(code))

        except Exception as e:  # noqa: BLE001
            return self._json({"error": str(e)}, 400)
        self._json({"error": "not found"}, 404)

    def do_DELETE(self):
        ensure_db_init()
        u = urlparse(self.path)
        sess = self._get_auth_user()
        user_id = sess["user_id"] if sess else None

        if u.path.startswith("/api/designs/"):
            design_id = u.path.rsplit("/", 1)[-1]
            player = sess["username"] if sess else None
            ok = DESIGNS.delete_design(design_id, user_id=user_id, player_name=player)
            return self._json({"ok": ok})
        self._json({"error": "not found"}, 404)


class Handler(ApiHandlerMixin, SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
    }

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(WEB), **kw)


def main():
    ensure_db_init()
    if db.is_available():
        print("Connected to TiDB and verified schema.")

    port = int(os.environ.get("PORT", 8600))
    srv = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Mission Architect on http://localhost:{port}")
    srv.serve_forever()


if __name__ == "__main__":
    main()
