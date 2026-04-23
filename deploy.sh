#!/bin/bash
set -e

# ============================================
#  Spell Bee Voice Bot — VM Deployment Script
#  Domain: spellbee.pawanpatra.com
# ============================================
#
# Usage:
#   1. SSH into your VM
#   2. Clone the repo: git clone https://github.com/YOUR_USER/curelinks.git
#   3. cd curelinks
#   4. Create backend/.env with your API keys
#   5. Run: sudo bash deploy.sh
#
# What this script does:
#   - Installs system dependencies (Python, Node, Nginx, Certbot)
#   - Sets up Python venv + installs pip dependencies
#   - Builds the React frontend for production
#   - Configures Nginx reverse proxy for spellbee.pawanpatra.com
#   - Sets up systemd service for the backend
#   - Obtains SSL certificate via Let's Encrypt
#   - Starts everything
#

DOMAIN="spellbee.pawanpatra.com"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
SERVICE_NAME="spellbee"
BACKEND_PORT=7860

echo ""
echo "============================================"
echo "  Deploying Spell Bee Voice Bot"
echo "  Domain: $DOMAIN"
echo "============================================"
echo ""

# --- Must be root ---
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Please run with sudo"
    echo "  sudo bash deploy.sh"
    exit 1
fi

# --- Check .env ---
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "ERROR: No backend/.env file found."
    echo ""
    echo "Create it first:"
    echo "  nano backend/.env"
    echo ""
    echo "With contents:"
    echo "  DEEPGRAM_API_KEY=your_key"
    echo "  GOOGLE_API_KEY=your_key"
    echo ""
    exit 1
fi

echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip nginx certbot python3-certbot-nginx curl git build-essential \
    libgl1-mesa-glx libglib2.0-0

# Install Node.js 20 if not present
if ! command -v node &>/dev/null; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

echo "  Python: $(python3 --version)"
echo "  Node:   $(node --version)"
echo "  npm:    $(npm --version)"

# --- Backend Setup ---
echo ""
echo "[2/8] Setting up Python backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q
deactivate

# --- Frontend Build ---
echo ""
echo "[3/8] Building React frontend..."
cd "$FRONTEND_DIR"

npm install
npm run build

echo "  Frontend built to: $FRONTEND_DIR/dist"

# --- Nginx Config ---
echo ""
echo "[4/8] Configuring Nginx..."

cat > /etc/nginx/sites-available/$SERVICE_NAME <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend — serve static build
    root $FRONTEND_DIR/dist;
    index index.html;

    # API — proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # SPA fallback — all non-file routes serve index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable site, remove default if exists
ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "  Nginx configured for $DOMAIN"

# --- Systemd Service ---
echo ""
echo "[5/8] Setting up systemd service..."

cat > /etc/systemd/system/$SERVICE_NAME.service <<SERVICE
[Unit]
Description=Spell Bee Voice Bot Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$BACKEND_DIR/venv/bin/python main.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

echo "  Service '$SERVICE_NAME' started"

# --- Wait for backend ---
echo ""
echo "[6/8] Waiting for backend to start..."
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        echo "  Backend is healthy!"
        break
    fi
    sleep 1
done

if ! curl -s http://127.0.0.1:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo "  WARNING: Backend not responding yet. Check logs:"
    echo "    journalctl -u $SERVICE_NAME -f"
fi

# --- SSL Certificate ---
echo ""
echo "[7/8] Setting up SSL certificate..."
echo "  Requesting Let's Encrypt certificate for $DOMAIN..."

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email --redirect || {
    echo ""
    echo "  SSL setup failed. Make sure:"
    echo "    1. DNS for $DOMAIN points to this server's IP"
    echo "    2. Port 80 and 443 are open in your firewall"
    echo ""
    echo "  You can retry SSL later with:"
    echo "    sudo certbot --nginx -d $DOMAIN"
    echo ""
}

# --- Firewall ---
echo ""
echo "[8/8] Configuring firewall..."
if command -v ufw &>/dev/null; then
    ufw allow 'Nginx Full' 2>/dev/null || true
    ufw allow OpenSSH 2>/dev/null || true
    echo "  Firewall rules updated"
else
    echo "  ufw not found, skipping firewall config"
fi

# --- Done ---
echo ""
echo "============================================"
echo "  Deployment Complete!"
echo ""
echo "  URL:     https://$DOMAIN"
echo "  Backend: http://127.0.0.1:$BACKEND_PORT"
echo ""
echo "  Useful commands:"
echo "    journalctl -u $SERVICE_NAME -f    # View backend logs"
echo "    systemctl restart $SERVICE_NAME   # Restart backend"
echo "    systemctl status $SERVICE_NAME    # Check status"
echo "    sudo certbot renew               # Renew SSL"
echo ""
echo "  To redeploy after code changes:"
echo "    cd $APP_DIR"
echo "    git pull"
echo "    sudo bash deploy.sh"
echo "============================================"
echo ""
