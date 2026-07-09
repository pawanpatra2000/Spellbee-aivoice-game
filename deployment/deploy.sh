#!/bin/bash
set -e

# Spellbee AI Voice Game - VM Deployment Script
# This script sets up the application on a VM with systemd and Nginx
# Assumes the repository is already present on the VM

APP_DIR="${1:-/opt/spellbee-aivoice}"
APP_USER="appuser"

echo "=========================================="
echo "Spellbee AI Voice Game - Deployment Setup"
echo "=========================================="
echo "App Directory: $APP_DIR"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

# Verify repo exists
if [ ! -d "$APP_DIR" ]; then
    echo "Error: Application directory not found at $APP_DIR"
    echo "Please copy the repository to $APP_DIR first"
    exit 1
fi

# Update system
echo "[1/7] Updating system packages..."
apt-get update && apt-get upgrade -y

# Install dependencies
echo "[2/7] Installing dependencies..."
apt-get install -y \
    python3.12 \
    python3.12-venv \
    python3-pip \
    nodejs \
    npm \
    nginx \
    curl \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpng16-16

# Create app user
echo "[3/7] Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$APP_DIR" "$APP_USER"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
else
    echo "User $APP_USER already exists"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
fi

# Setup backend
echo "[4/7] Setting up backend..."
cd "$APP_DIR/backend"
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Build frontend
echo "[5/7] Building frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build
cp -r dist "$APP_DIR/backend/static"

# Setup environment file
echo "[6/7] Setting up environment configuration..."
mkdir -p /etc/spellbee-aivoice
if [ ! -f /etc/spellbee-aivoice/.env ]; then
    cat > /etc/spellbee-aivoice/.env << EOF
PYTHONUNBUFFERED=1
PYTHONDONTWRITEBYTECODE=1
GEMINI_API_KEY=your_api_key_here
LLM_MODEL=gemini-3.1-flash-lite-preview
EOF
    chmod 600 /etc/spellbee-aivoice/.env
    echo "Created .env file at /etc/spellbee-aivoice/.env - please update with your API keys"
else
    echo ".env file already exists"
fi

# Setup systemd service
echo "[6.5/7] Installing systemd service..."
cp "$APP_DIR/deployment/spellbee-aivoice.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable spellbee-aivoice

# Setup Nginx
echo "[7/7] Configuring Nginx..."
cp "$APP_DIR/deployment/nginx.conf" /etc/nginx/sites-available/spellbee-aivoice
if [ -f /etc/nginx/sites-enabled/spellbee-aivoice ]; then
    rm /etc/nginx/sites-enabled/spellbee-aivoice
fi
ln -s /etc/nginx/sites-available/spellbee-aivoice /etc/nginx/sites-enabled/

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo "Testing Nginx configuration..."
nginx -t

# Start services
echo ""
echo "=========================================="
echo "Starting services..."
echo "=========================================="
systemctl restart nginx
systemctl start spellbee-aivoice

# Check status
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Service Status:"
systemctl status spellbee-aivoice --no-pager
echo ""
echo "Next steps:"
echo "1. Update API keys in /etc/spellbee-aivoice/.env"
echo "2. Test the application: curl http://localhost:8000/docs"
echo "3. Access via browser: http://spellbee.pawanpatra.com"
echo ""
echo "Useful commands:"
echo "  - View logs: journalctl -u spellbee-aivoice -f"
echo "  - Restart service: systemctl restart spellbee-aivoice"
echo "  - Check Nginx: nginx -t"
echo "  - Reload Nginx: systemctl reload nginx"
