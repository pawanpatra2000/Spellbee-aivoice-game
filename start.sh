#!/bin/bash
set -e

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  Spell Bee Voice Bot — Setup & Start"
echo "============================================"
echo ""

# --- Check for .env ---
if [ -f "$SCRIPT_DIR/backend/.env" ]; then
    echo "Found backend/.env file"
else
    echo "WARNING: No backend/.env file found."
    echo ""
    echo "Create it with:"
    echo "  cp .env.example backend/.env"
    echo ""
    echo "Then fill in your API keys:"
    echo "  DEEPGRAM_API_KEY=  (https://console.deepgram.com)"
    echo "  GOOGLE_API_KEY=    (https://aistudio.google.com/apikey)"
    echo ""
    exit 1
fi

# --- Find Python ---
PYTHON=""
for cmd in python3.13 python3.12 python3.11 python3; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON="$cmd"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "ERROR: Python 3.11+ is required but not found."
    exit 1
fi

echo "Using Python: $($PYTHON --version)"

# --- Check Node.js ---
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js 18+ is required but not found."
    exit 1
fi

echo "Using Node:   $(node --version)"
echo ""

# --- Backend Setup ---
echo "[1/5] Setting up Python backend..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    $PYTHON -m venv venv
fi

echo "  Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt --quiet 2>/dev/null

cd "$SCRIPT_DIR"

# --- Frontend Setup ---
echo "[2/5] Setting up React frontend..."
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install --silent 2>/dev/null
fi

cd "$SCRIPT_DIR"

# --- Kill existing processes on our ports ---
echo "[3/5] Freeing ports..."
for port in 7860 5173; do
    pids=$(lsof -t -i :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "  Killing existing processes on port $port"
        kill -9 $pids 2>/dev/null || true
        sleep 1
    fi
done

echo "[4/5] Starting backend server (port 7860)..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
python main.py &
BACKEND_PID=$!

cd "$SCRIPT_DIR"

# Give backend a moment to start
sleep 3

echo "[5/5] Starting frontend dev server (port 5173)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cd "$SCRIPT_DIR"

echo ""
echo "============================================"
echo "  Ready!"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:7860"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop both servers."

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
