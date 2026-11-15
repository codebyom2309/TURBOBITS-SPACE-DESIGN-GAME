"""TiDB / MySQL database connection manager and migration runner."""
from __future__ import annotations

import json
import os
import queue
import ssl
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from urllib.parse import unquote, urlparse

try:
    import pymysql
    import pymysql.cursors
    HAS_PYMYSQL = True
except ImportError:
    pymysql = None
    HAS_PYMYSQL = False

# Load .env if present
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def _parse_db_config() -> tuple[bool, str, int, str, str, str, bool]:
    db_url = os.environ.get("DATABASE_URL", "").strip()
    tidb_host = os.environ.get("TIDB_HOST", "").strip()
    configured = bool(tidb_host or db_url)

    host = tidb_host or "127.0.0.1"
    port = int(os.environ.get("TIDB_PORT") or 4000)
    user = os.environ.get("TIDB_USER", "root")
    password = os.environ.get("TIDB_PASSWORD", "")
    database = os.environ.get("TIDB_DATABASE", "mission_architect")
    use_ssl = os.environ.get("TIDB_SSL", "true").lower() in ("true", "1", "yes")

    if db_url and not tidb_host:
        u = urlparse(db_url)
        if u.hostname:
            host = u.hostname
        if u.port:
            port = int(u.port)
        if u.username:
            user = unquote(u.username)
        if u.password is not None:
            password = unquote(u.password)
        if u.path and u.path.strip("/"):
            database = u.path.strip("/")
        if "ssl=false" in (u.query or "").lower():
            use_ssl = False

    return configured, host, port, user, password, database, use_ssl


IS_CONFIGURED, HOST, PORT, USER, PASSWORD, DATABASE, USE_SSL = _parse_db_config()

_pool: queue.Queue[pymysql.Connection] = queue.Queue(maxsize=20)
_pool_lock = threading.Lock()
_initialized = False
_available: bool | None = None


def is_available() -> bool:
    """Return True if TiDB is configured and reachable."""
    global _available
    if _available is not None:
        return _available
    if not HAS_PYMYSQL or not IS_CONFIGURED:
        _available = False
        return False
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        _available = True
        return True
    except Exception:
        _available = False
        return False


def _create_connection() -> pymysql.Connection:
    if not HAS_PYMYSQL:
        raise RuntimeError("pymysql is not installed")
    ssl_ctx = ssl.create_default_context() if USE_SSL else None
    return pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=DATABASE,
        ssl=ssl_ctx,
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor,
        charset="utf8mb4",
        connect_timeout=10,
        read_timeout=30,
        write_timeout=30,
    )


@contextmanager
def get_db():
    """Context manager yielding a pooled database connection."""
    conn = None
    try:
        try:
            conn = _pool.get_nowait()
            conn.ping()
        except (queue.Empty, Exception):
            conn = _create_connection()
        yield conn
    except Exception:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn:
            try:
                if not conn.open:
                    conn = _create_connection()
                _pool.put_nowait(conn)
            except queue.Full:
                try:
                    conn.close()
                except Exception:
                    pass


def execute_commit(sql: str, args: tuple | list | dict = ()) -> int:
    """Execute SQL and commit transaction, returning affected rows or lastrowid."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            last_id = cur.lastrowid
            conn.commit()
            return last_id or cur.rowcount


def fetch_all(sql: str, args: tuple | list | dict = ()) -> list[dict[str, Any]]:
    """Execute SQL and return all matching rows as dicts."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            return list(cur.fetchall())


def fetch_one(sql: str, args: tuple | list | dict = ()) -> dict[str, Any] | None:
    """Execute SQL and return one matching row as a dict, or None."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            row = cur.fetchone()
            return dict(row) if row else None


SCHEMA_STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS users (
        id BIGINT AUTO_RANDOM PRIMARY KEY,
        username VARCHAR(30) NOT NULL UNIQUE,
        display_name VARCHAR(50) NOT NULL DEFAULT '',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username)
    )""",
    """CREATE TABLE IF NOT EXISTS leaderboard (
        id BIGINT AUTO_RANDOM PRIMARY KEY,
        user_id BIGINT NULL,
        player_name VARCHAR(50) NOT NULL DEFAULT 'anonymous',
        mission_name VARCHAR(100) NOT NULL DEFAULT 'Unnamed mission',
        scenario VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        score DOUBLE NOT NULL,
        grade VARCHAR(5) NOT NULL,
        seed BIGINT NOT NULL,
        design_json JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_scenario_score (scenario, score DESC),
        INDEX idx_user (user_id),
        CONSTRAINT fk_lb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )""",
    """CREATE TABLE IF NOT EXISTS rooms (
        code VARCHAR(10) PRIMARY KEY,
        scenario VARCHAR(50) NOT NULL,
        design_json JSON NOT NULL,
        approvals JSON NOT NULL,
        version INT NOT NULL DEFAULT 0,
        last_run_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS room_players (
        room_code VARCHAR(10) NOT NULL,
        player_name VARCHAR(50) NOT NULL,
        roles_json JSON NOT NULL,
        last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (room_code, player_name),
        CONSTRAINT fk_rp_room FOREIGN KEY (room_code) REFERENCES rooms(code) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS room_chat (
        id BIGINT AUTO_RANDOM PRIMARY KEY,
        room_code VARCHAR(10) NOT NULL,
        player_name VARCHAR(50) NOT NULL,
        message VARCHAR(500) NOT NULL,
        is_user_msg BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_room_chat (room_code, id ASC),
        CONSTRAINT fk_rc_room FOREIGN KEY (room_code) REFERENCES rooms(code) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS saved_designs (
        id BIGINT AUTO_RANDOM PRIMARY KEY,
        user_id BIGINT NULL,
        player_name VARCHAR(50) NOT NULL DEFAULT 'anonymous',
        name VARCHAR(100) NOT NULL DEFAULT 'Untitled',
        scenario VARCHAR(50) NOT NULL,
        design_json JSON NOT NULL,
        flight_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_designs (user_id, created_at DESC),
        INDEX idx_player_designs (player_name, created_at DESC),
        CONSTRAINT fk_sd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS careers (
        id BIGINT AUTO_RANDOM PRIMARY KEY,
        user_id BIGINT NULL,
        player_name VARCHAR(50) NOT NULL DEFAULT 'anonymous',
        agency_name VARCHAR(100) NOT NULL DEFAULT 'My Agency',
        difficulty VARCHAR(20) NOT NULL DEFAULT 'normal',
        current_month INT NOT NULL DEFAULT 0,
        career_json JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX uq_user_career (user_id),
        INDEX idx_player_career (player_name),
        CONSTRAINT fk_car_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS genesis_progress (
        id BIGINT AUTO_RANDOM PRIMARY KEY,
        player_name VARCHAR(50) NOT NULL UNIQUE,
        progress_json JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_genesis_player (player_name)
    )""",
    """CREATE TABLE IF NOT EXISTS user_sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        username VARCHAR(30) NOT NULL,
        display_name VARCHAR(50) NOT NULL DEFAULT '',
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_user (user_id),
        INDEX idx_session_exp (expires_at),
        CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )""",
]

MIGRATION_STATEMENTS = [
    "ALTER TABLE rooms ADD COLUMN meta_json JSON NULL",
]


def init_db():
    """Idempotently initialize all database tables and backward-compatible migrations."""
    global _initialized
    if not is_available():
        return
    with _pool_lock:
        if _initialized:
            return
        with get_db() as conn:
            with conn.cursor() as cur:
                for stmt in SCHEMA_STATEMENTS:
                    cur.execute(stmt)
                for m_stmt in MIGRATION_STATEMENTS:
                    try:
                        cur.execute(m_stmt)
                    except Exception:
                        pass
            conn.commit()
        _initialized = True

