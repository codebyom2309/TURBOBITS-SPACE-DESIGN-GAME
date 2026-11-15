"""Vercel Python serverless entrypoint for all /api/* routes."""
from __future__ import annotations

import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import server  # noqa: E402


class handler(server.ApiHandlerMixin, BaseHTTPRequestHandler):
    def do_GET(self):
        if not self._handle_api_get():
            self._json({"error": "not found"}, 404)
