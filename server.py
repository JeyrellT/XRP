#!/usr/bin/env python3
"""
Servidor HTTP simple con headers para prevenir caché durante desarrollo
"""
import http.server
import socketserver
from http.server import SimpleHTTPRequestHandler
import os

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Headers para prevenir caché durante desarrollo
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 8000

# Cambiar al directorio del archivo
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f"🚀 Servidor iniciado en puerto {PORT}")
    print(f"📱 Accede a: http://localhost:{PORT}")
    print("🔄 Headers anti-caché activados para desarrollo")
    httpd.serve_forever()
