#!/bin/bash
set -e

echo "============================================"
echo "  Spell Bee Voice Bot - Starting Up"
echo "============================================"
echo ""

# Check for .env file
if [ ! -f backend/.env ]; then
    echo "ERROR: backend/.env not found!"
    echo ""
    echo "Run these commands first:"
    echo "  cp .env.example backend/.env"
    echo "  # Then edit backend/.env and add your API keys"
    echo ""
    exit 1
fi

# Install backend dependencies
echo "[1/4] Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Install frontend dependencies
echo "[2/4] Installing frontend dependencies..."
cd frontend
npm install --silent 2>/dev/null
cd ..

# Start backend
echo "[3/4] Starting backend server on port 7860..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Start frontend
echo "[4/4] Starting frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "  App is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:7860"
echo "============================================"
echo "Press Ctrl+C to stop both servers."
echo ""

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
