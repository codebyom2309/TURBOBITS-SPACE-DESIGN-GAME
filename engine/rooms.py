"""Shared multiplayer state: a room holds one design that 1-4 players edit together.

Backed by TiDB for persistence across restarts, with an in-memory cache for fast polling.
"""
from __future__ import annotations

import json
import logging
import random
import string
import threading
import time
from typing import Any

from . import catalog as C
from . import db
from .model import blank_design

logger = logging.getLogger(__name__)

FIELD_OWNER = {f: r for r, info in C.ROLES.items() for f in info["owns"]}
FIELD_OWNER.update({"scenario": "manager", "sandbox": "manager"})

DEFAULT_META = {
    "team_name": "Horizon Engineering Unit",
    "callsign": "HZN-01",
    "description": "Horizon Coalition cooperative spacecraft engineering team.",
    "emblem": "horizon",
    "collab_mode": "role_strict",
    "host": "",
}


class RoomStore:
    def __init__(self):
        self._rooms: dict[str, dict] = {}
        self._lock = threading.Lock()

    def _load_from_db(self, code: str) -> dict | None:
        try:
            r_row = db.fetch_one("SELECT * FROM rooms WHERE code = %s", (code,))
            if not r_row:
                return None
            players: dict[str, Any] = {}
            for p in db.fetch_all("SELECT * FROM room_players WHERE room_code = %s", (code,)):
                raw_roles = json.loads(p["roles_json"]) if isinstance(p["roles_json"], str) else p["roles_json"]
                seen = p["last_seen"].timestamp() if hasattr(p["last_seen"], "timestamp") else time.time()
                if isinstance(raw_roles, dict):
                    players[p["player_name"]] = {
                        "roles": list(raw_roles.get("roles", [])),
                        "ready": bool(raw_roles.get("ready", False)),
                        "avatar": str(raw_roles.get("avatar", "eng1")),
                        "seen": seen,
                    }
                else:
                    players[p["player_name"]] = {
                        "roles": list(raw_roles or []),
                        "ready": False,
                        "avatar": "eng1",
                        "seen": seen,
                    }

            chat: list[dict] = []
            for c in db.fetch_all("SELECT * FROM room_chat WHERE room_code = %s ORDER BY id ASC LIMIT 60", (code,)):
                t = c["created_at"].timestamp() if hasattr(c["created_at"], "timestamp") else time.time()
                chat.append({
                    "t": t,
                    "who": c["player_name"],
                    "text": c["message"],
                    "msg": bool(c["is_user_msg"]),
                })

            design = json.loads(r_row["design_json"]) if isinstance(r_row["design_json"], str) else r_row["design_json"]
            approvals = json.loads(r_row["approvals"]) if isinstance(r_row["approvals"], str) else r_row["approvals"]
            last_run = None
            if r_row.get("last_run_json"):
                last_run = json.loads(r_row["last_run_json"]) if isinstance(r_row["last_run_json"], str) else r_row["last_run_json"]
            meta = dict(DEFAULT_META)
            if r_row.get("meta_json"):
                try:
                    loaded_meta = json.loads(r_row["meta_json"]) if isinstance(r_row["meta_json"], str) else r_row["meta_json"]
                    if isinstance(loaded_meta, dict):
                        meta.update(loaded_meta)
                except Exception:
                    pass
            created = r_row["created_at"].timestamp() if hasattr(r_row["created_at"], "timestamp") else time.time()

            return {
                "design": design,
                "version": int(r_row["version"]),
                "players": players,
                "approvals": approvals,
                "chat": chat,
                "last_run": last_run,
                "meta": meta,
                "created": created,
                "scenario": r_row["scenario"],
            }
        except Exception as e:
            logger.debug("TiDB room load skipped/failed for %s: %s", code, e)
            return None

    def _save_room_meta(self, code: str):
        r = self._rooms.get(code)
        if not r:
            return
        try:
            design_str = json.dumps(r["design"])
            approvals_str = json.dumps(r["approvals"])
            last_run_str = json.dumps(r["last_run"]) if r.get("last_run") else None
            meta_str = json.dumps(r.get("meta") or DEFAULT_META)
            scenario = r["design"].get("scenario", "wildfire")
            try:
                db.execute_commit(
                    """INSERT INTO rooms (code, scenario, design_json, approvals, version, last_run_json, meta_json)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                         scenario = VALUES(scenario),
                         design_json = VALUES(design_json),
                         approvals = VALUES(approvals),
                         version = VALUES(version),
                         last_run_json = VALUES(last_run_json),
                         meta_json = VALUES(meta_json)""",
                    (code, scenario, design_str, approvals_str, r["version"], last_run_str, meta_str),
                )
            except Exception:
                db.execute_commit(
                    """INSERT INTO rooms (code, scenario, design_json, approvals, version, last_run_json)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                         scenario = VALUES(scenario),
                         design_json = VALUES(design_json),
                         approvals = VALUES(approvals),
                         version = VALUES(version),
                         last_run_json = VALUES(last_run_json)""",
                    (code, scenario, design_str, approvals_str, r["version"], last_run_str),
                )
        except Exception as e:
            logger.debug("TiDB room meta save skipped/failed for %s: %s", code, e)

    def _save_player(self, code: str, player: str, info: dict):
        try:
            payload = {
                "roles": list(info.get("roles", [])),
                "ready": bool(info.get("ready", False)),
                "avatar": str(info.get("avatar", "eng1")),
            }
            db.execute_commit(
                """INSERT INTO room_players (room_code, player_name, roles_json)
                   VALUES (%s, %s, %s)
                   ON DUPLICATE KEY UPDATE roles_json = VALUES(roles_json)""",
                (code, player, json.dumps(payload)),
            )
        except Exception as e:
            logger.debug("TiDB player save skipped/failed for %s: %s", code, e)

    def _delete_player_db(self, code: str, player: str):
        try:
            db.execute_commit(
                "DELETE FROM room_players WHERE room_code = %s AND player_name = %s",
                (code, player),
            )
        except Exception as e:
            logger.debug("TiDB player delete skipped/failed for %s: %s", code, e)

    def _save_chat(self, code: str, who: str, text: str, is_user_msg: bool = False):
        try:
            db.execute_commit(
                """INSERT INTO room_chat (room_code, player_name, message, is_user_msg)
                   VALUES (%s, %s, %s, %s)""",
                (code, who, text[:500], is_user_msg),
            )
        except Exception as e:
            logger.debug("TiDB chat save skipped/failed for %s: %s", code, e)

    def _log_event(self, code: str, who: str, text: str, is_user_msg: bool = False):
        r = self._rooms.get(code)
        if not r:
            return
        r["chat"].append({"t": time.time(), "who": who, "text": text[:300], "msg": is_user_msg})
        r["chat"] = r["chat"][-60:]
        self._save_chat(code, who, text[:300], is_user_msg=is_user_msg)

    def _ensure_room(self, code: str) -> bool:
        if code in self._rooms:
            if db.is_available():
                try:
                    row = db.fetch_one("SELECT version FROM rooms WHERE code = %s", (code,))
                    if row and int(row["version"]) > int(self._rooms[code].get("version", -1)):
                        loaded = self._load_from_db(code)
                        if loaded:
                            self._rooms[code] = loaded
                except Exception as e:
                    logger.debug("TiDB room version sync skipped for %s: %s", code, e)
            return True
        loaded = self._load_from_db(code)
        if loaded:
            self._rooms[code] = loaded
            return True
        return False

    def create(self, scenario: str = "wildfire", meta: dict | None = None) -> str:
        with self._lock:
            if scenario not in C.SCENARIOS:
                scenario = "wildfire"
            while True:
                code = "".join(random.choices(string.ascii_uppercase.replace("O", "").replace("I", ""), k=4))
                if not self._ensure_room(code):
                    break
            room_meta = dict(DEFAULT_META)
            if meta:
                for k in ("team_name", "callsign", "description", "emblem", "collab_mode", "host"):
                    if meta.get(k) is not None:
                        room_meta[k] = str(meta[k])[:120]
            self._rooms[code] = {
                "design": blank_design(scenario),
                "version": 0,
                "players": {},
                "approvals": {r: False for r in C.ROLES},
                "chat": [],
                "last_run": None,
                "meta": room_meta,
                "created": time.time(),
            }
            host_name = room_meta.get("host") or "Mission Host"
            self._log_event(
                code,
                host_name,
                f"established team '{room_meta['team_name']}' [{room_meta['callsign']}] for {C.SCENARIOS[scenario]['name']}",
                is_user_msg=False,
            )
            self._save_room_meta(code)
            return code

    def exists(self, code: str) -> bool:
        with self._lock:
            return self._ensure_room(code)

    def get(self, code: str) -> dict:
        with self._lock:
            self._ensure_room(code)
            r = self._rooms[code]
            return {
                **r,
                "design": dict(r["design"]),
                "players": dict(r["players"]),
                "approvals": dict(r["approvals"]),
                "chat": list(r["chat"]),
                "meta": dict(r.get("meta") or DEFAULT_META),
            }

    def version(self, code: str) -> int:
        with self._lock:
            if not self._ensure_room(code):
                return -1
            return self._rooms[code]["version"]

    def touch(self, code: str, player: str):
        with self._lock:
            if not self._ensure_room(code):
                return
            r = self._rooms[code]
            if player and player in r["players"]:
                now = time.time()
                prev_seen = float(r["players"][player].get("seen", 0))
                r["players"][player]["seen"] = now
                if db.is_available() and (now - prev_seen) >= 10:
                    try:
                        db.execute_commit(
                            "UPDATE room_players SET last_seen = CURRENT_TIMESTAMP WHERE room_code = %s AND player_name = %s",
                            (code, player),
                        )
                    except Exception as e:
                        logger.debug("TiDB touch skipped for %s/%s: %s", code, player, e)

    def join(self, code: str, player: str, roles: list[str], avatar: str | None = None, ready: bool | None = None):
        with self._lock:
            if not self._ensure_room(code):
                return
            r = self._rooms[code]
            player = player or "anonymous"
            prev = r["players"].get(player)
            was_new = prev is None
            prev_roles = list(prev.get("roles", [])) if prev else []
            info = {
                "roles": list(roles),
                "seen": time.time(),
                "ready": bool(ready if ready is not None else (prev.get("ready", False) if prev else False)),
                "avatar": str(avatar or (prev.get("avatar", "eng1") if prev else "eng1"))[:20],
            }
            r["players"][player] = info
            if not r.get("meta", {}).get("host"):
                r.setdefault("meta", dict(DEFAULT_META))["host"] = player
            # Clear approvals for any roles dropped
            for dropped in set(prev_roles) - set(roles):
                if dropped in r["approvals"]:
                    r["approvals"][dropped] = False
            r["version"] += 1
            if was_new:
                self._log_event(code, player, "joined the engineering lobby", is_user_msg=False)
            elif set(prev_roles) != set(roles):
                if roles:
                    role_names = ", ".join(C.ROLES[rk]["name"] for rk in roles if rk in C.ROLES)
                    self._log_event(code, player, f"assigned to {role_names}", is_user_msg=False)
                else:
                    self._log_event(code, player, "released role assignment", is_user_msg=False)
            self._save_room_meta(code)
            self._save_player(code, player, info)

    def set_ready(self, code: str, player: str, ready: bool) -> bool:
        with self._lock:
            if not self._ensure_room(code):
                return False
            r = self._rooms[code]
            if player not in r["players"]:
                return False
            r["players"][player]["ready"] = bool(ready)
            r["players"][player]["seen"] = time.time()
            r["version"] += 1
            self._log_event(code, player, "marked READY for mission operations" if ready else "marked STANDING BY", is_user_msg=False)
            self._save_room_meta(code)
            self._save_player(code, player, r["players"][player])
            return True

    def kick(self, code: str, actor: str, target: str) -> bool:
        with self._lock:
            if not self._ensure_room(code):
                return False
            r = self._rooms[code]
            host = r.get("meta", {}).get("host", "")
            if actor != host and actor != target:
                return False
            if target not in r["players"]:
                return False
            dropped_roles = r["players"][target].get("roles", [])
            for rk in dropped_roles:
                r["approvals"][rk] = False
            del r["players"][target]
            if host == target:
                remaining = list(r["players"].keys())
                r.setdefault("meta", dict(DEFAULT_META))["host"] = remaining[0] if remaining else ""
            r["version"] += 1
            self._log_event(code, actor, f"removed {target} from the team roster" if actor != target else "left the team room", is_user_msg=False)
            self._save_room_meta(code)
            self._delete_player_db(code, target)
            return True

    def update_meta(self, code: str, actor: str, updates: dict) -> bool:
        with self._lock:
            if not self._ensure_room(code):
                return False
            r = self._rooms[code]
            meta = r.setdefault("meta", dict(DEFAULT_META))
            for k in ("team_name", "callsign", "description", "emblem", "collab_mode"):
                if k in updates and updates[k] is not None:
                    meta[k] = str(updates[k])[:120]
            if "scenario" in updates and updates["scenario"] in C.SCENARIOS:
                new_sc = updates["scenario"]
                if r["design"].get("scenario") != new_sc:
                    r["design"] = blank_design(new_sc) | {"difficulty": r["design"].get("difficulty", "normal")}
                    r["approvals"] = {k: False for k in r["approvals"]}
                    self._log_event(code, actor, f"switched mission assignment to {C.SCENARIOS[new_sc]['name']}", is_user_msg=False)
            r["version"] += 1
            self._save_room_meta(code)
            return True

    def roles_taken(self, code: str, exclude: str | None = None) -> dict[str, str]:
        with self._lock:
            self._ensure_room(code)
            r = self._rooms[code]
            return {role: p for p, info in r["players"].items() if p != exclude for role in info["roles"]}

    def set_field(self, code: str, player: str, field: str, value) -> bool:
        with self._lock:
            if not self._ensure_room(code):
                return False
            r = self._rooms[code]
            owner = FIELD_OWNER.get(field)
            collab_mode = (r.get("meta") or {}).get("collab_mode", "role_strict")
            player_roles = r["players"].get(player, {}).get("roles", [])
            if collab_mode != "open_coop" and owner not in player_roles:
                return False
            if r["design"].get(field) == value:
                return True
            if field == "scenario":
                if value not in C.SCENARIOS:
                    return False
                r["design"] = blank_design(value) | {"difficulty": r["design"]["difficulty"]}
                summary = f"selected mission: {C.SCENARIOS[value]['name']}"
            else:
                r["design"][field] = value
                summary = f"updated {field} \u2192 {value}"
            r["approvals"] = {k: False for k in r["approvals"]}
            if player in r["players"]:
                r["players"][player]["seen"] = time.time()
            r["version"] += 1
            self._log_event(code, player, summary, is_user_msg=False)
            self._save_room_meta(code)
            return True

    def replace_design(self, code: str, design: dict):
        with self._lock:
            if not self._ensure_room(code):
                return
            r = self._rooms[code]
            r["design"] = dict(design)
            r["approvals"] = {k: False for k in r["approvals"]}
            r["version"] += 1
            self._save_room_meta(code)

    def approve(self, code: str, player: str, role: str, value: bool = True) -> bool:
        with self._lock:
            if not self._ensure_room(code):
                return False
            r = self._rooms[code]
            if role not in r["players"].get(player, {}).get("roles", []):
                return False
            r["approvals"][role] = value
            if player in r["players"]:
                r["players"][player]["seen"] = time.time()
            r["version"] += 1
            role_label = C.ROLES.get(role, {}).get("name", role)
            self._log_event(
                code,
                player,
                f"stamped LAUNCH APPROVAL for {role_label}" if value else f"withdrew approval for {role_label}",
                is_user_msg=False,
            )
            self._save_room_meta(code)
            return True

    def all_approved(self, code: str) -> bool:
        with self._lock:
            if not self._ensure_room(code):
                return False
            return all(self._rooms[code]["approvals"].values())

    def say(self, code: str, player: str, text: str):
        with self._lock:
            if not self._ensure_room(code):
                return
            r = self._rooms[code]
            msg_text = text.strip()[:300]
            if not msg_text:
                return
            if player in r["players"]:
                r["players"][player]["seen"] = time.time()
            r["version"] += 1
            self._log_event(code, player, msg_text, is_user_msg=True)
            self._save_room_meta(code)

    def set_last_run(self, code: str, run: dict):
        with self._lock:
            if not self._ensure_room(code):
                return
            self._rooms[code]["last_run"] = run
            self._rooms[code]["version"] += 1
            sc = (run.get("score") or {}).get("grade", "?")
            pts = (run.get("score") or {}).get("total", 0)
            self._log_event(code, "FLIGHT DIRECTOR", f"launched shared mission — Grade {sc} ({pts} pts)", is_user_msg=False)
            self._save_room_meta(code)
