#!/usr/bin/env python3
"""Local dev server that behaves like the Cloudflare Workers host.

Two differences from `python -m http.server`, both of which matter:

1. Extensionless routes. Production serves /menu and 307s /menu.html, so links
   in the HTML are extensionless. Plain http.server 404s those, which would make
   local testing disagree with the deployed site.
2. No-store on everything. The browser aggressively caches assets/*.css and
   assets/*.js over plain http.server, which silently hides edits behind a stale
   copy. Dev should always show the file on disk.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent.resolve()


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = Path(super().translate_path(path))
        # /menu -> menu.html, matching the Workers static-asset behavior
        if not local.exists() and not local.suffix:
            candidate = local.with_suffix(".html")
            if candidate.is_file():
                return str(candidate)
        return str(local)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        custom = ROOT / "404.html"
        if code == 404 and custom.is_file():
            body = custom.read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        if not str(args[1] if len(args) > 1 else "").startswith("2"):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(Handler, directory=str(ROOT))
    print(f"Jumbo King dev server -> http://localhost:{port}")
    ThreadingHTTPServer(("", port), handler).serve_forever()
