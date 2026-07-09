#!/bin/bash
set -e

# ============================================================
# Quick Deployment Script for Spellbee on Server
# Run this after cloning the repo to /root/spellbee
# ============================================================

echo "🚀 Spellbee Quick Deployment"
echo "=============================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ ERROR: Please run with sudo"
    echo "   sudo bash QUICK_DEPLOY.sh"
    exit 1
fi

SPELLBEE_DIR="/root/spellbee"
BACKEND_DIR="$SPELLBEE_DIR/backend"
FRONTEND_DIR="$SPELLBEE_DIR/frontend"

# Check .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "❌ ERROR: No backend/.env found"
    echo ""
    echo "Create it first:"
    echo "  cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env"
    echo "  nano $BACKEND_DIR/.env"
    echo ""
    echo "Required keys:"
    echo "  DEEPGRAM_API_KEY=..."
    echo "  GOOGLE_API_KEY=..."
    exit 1
fi

echo "✅ Checking prerequisites..."

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "❌ Python3 not found. Install it:"
    echo "   sudo apt install python3 python3-venv python3-pip"
    exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
    echo "❌ Node.js not found. Install it:"
    echo "   sudo apt install nodejs npm"
    exit 1
fi

# Check Nginx
if ! command -v nginx &>/dev/null; then
    echo "❌ Nginx not found. Install it:"
    echo "   sudo apt install nginx"
    exit 1
fi

echo "✅ Python: $(python3 --version)"
echo "✅ Node:   $(node --version)"
echo "✅ Nginx:  $(nginx -v 2>&1)"
echo ""

# Backend setup
echo "📦 [1/6] Setting up Python backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

source venv/bin/activate
pip install -q -r requirements.txt
deactivate
echo "✅ Python dependencies installed"

# Frontend setup
echo "📦 [2/6] Setting up React frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    npm install -q
    echo "✅ npm dependencies installed"
fi

npm run build -q 2>/dev/null || npm run build
echo "✅ Frontend built to dist/"

# Make startup script executable
echo "📦 [3/6] Setting up startup scripts..."
chmod +x "$SPELLBEE_DIR/start-backend.sh"
echo "✅ start-backend.sh is executable"

# Copy systemd services
echo "📦 [4/6] Installing systemd services..."
cp "$SPELLBEE_DIR/spellbee-backend.service" /etc/systemd/system/
cp "$SPELLBEE_DIR/spellbee-frontend.service" /etc/systemd/system/
cp "$SPELLBEE_DIR/spellbee.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable spellbee-backend.service
systemctl enable spellbee-frontend.service
systemctl enable spellbee.service
echo "✅ Systemd services installed and enabled"

# Configure Nginx
echo "📦 [5/6] Configuring Nginx..."
cp "$SPELLBEE_DIR/nginx.conf" /etc/nginx/sites-available/spellbee
ln -sf /etc/nginx/sites-available/spellbee /etc/nginx/sites-enabled/spellbee

# Test Nginx config
if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "⚠️  Nginx config has errors. Check it:"
    echo "   sudo nginx -t"
fi

# Start services
echo "📦 [6/6] Starting services..."
systemctl start spellbee-backend
systemctl start spellbee-frontend
echo "✅ Services started"

# Health check
echo ""
echo "🔍 Health Check:"
sleep 3

if curl -s http://127.0.0.1:7860/api/health >/dev/null 2>&1; then
    echo "✅ Backend (port 7860) is healthy"
else
    echo "⚠️  Backend not responding yet. Check logs:"
    echo "   sudo journalctl -u spellbee-backend -f"
fi

if curl -s http://127.0.0.1:5173 >/dev/null 2>&1; then
    echo "✅ Frontend (port 5173) is running"
else
    echo "⚠️  Frontend not responding yet"
fi

# SSL setup reminder
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Setup SSL Certificate (if not done):"
echo "   sudo certbot certonly --nginx -d spellbee.pawanpatra.com"
echo ""
echo "2. Verify Nginx configuration is correct:"
echo "   sudo nginx -t"
echo ""
echo "3. View logs:"
echo "   sudo journalctl -u spellbee-backend -f"
echo "   sudo journalctl -u spellbee-frontend -f"
echo ""
echo "4. Test the application:"
echo "   https://spellbee.pawanpatra.com"
echo ""
echo "5. Useful commands:"
echo "   sudo systemctl status spellbee"
echo "   sudo systemctl restart spellbee"
echo "   sudo systemctl stop spellbee"
echo ""
echo "=============================="
echo "✨ Deployment Complete!"
echo "=============================="
