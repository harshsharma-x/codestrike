#!/usr/bin/env bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║     CodeStrike AI — Dev Mode         ║"
echo "╚══════════════════════════════════════╝"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_PID=""
SERVER_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  wait
  echo "Done."
  exit 0
}

trap cleanup SIGINT SIGTERM

# Build server first
echo "[1/3] Building server..."
cd "$ROOT_DIR/apps/server"
npx tsup src/index.ts --format esm,cjs --silent
echo "  ✓ Server built"

# Start server
echo "[2/3] Starting API server (port 4000)..."
node dist/index.js &
SERVER_PID=$!
sleep 2

# Start web
echo "[3/3] Starting Web IDE (port 3000)..."
cd "$ROOT_DIR/apps/web"
npx next dev -p 3000 &
WEB_PID=$!

echo ""
echo "  Web IDE:   http://localhost:3000"
echo "  API Docs:  http://localhost:4000/docs"
echo "  API Health: http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

wait
