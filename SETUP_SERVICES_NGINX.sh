#!/bin/bash
set -e

# ============================================================
# Setup Systemd Services & Nginx for Spellbee
# Run this on your server after clone
# ============================================================

echo "🔧 Setting up Spellbee Services & Nginx"
echo "========================================"
echo ""

# Check if root
if [ "$EUID" -ne 0 ]; then
    echo "❌ ERROR: Please run with sudo"
    echo "   sudo bash SETUP_SERVICES_NGINX.sh"
    exit 1
fi

SPELLBEE_DIR="/root/spellbee"

# Check if files exist
if [ ! -f "$SPELLBEE_DIR/spellbee-backend.service" ]; then
    echo "❌ ERROR: Service files not found at $SPELLBEE_DIR/"
    echo "Make sure you've cloned the repo to /root/spellbee"
    exit 1
fi

echo ""
echo "📋 [Step 1/4] Copying Systemd Service Files..."

# Copy service files
cp "$SPELLBEE_DIR/spellbee-backend.service" /etc/systemd/system/
cp "$SPELLBEE_DIR/spellbee-frontend.service" /etc/systemd/system/
cp "$SPELLBEE_DIR/spellbee.service" /etc/systemd/system/

echo "✅ Service files copied to /etc/systemd/system/"

# Reload systemd
echo ""
echo "📋 [Step 2/4] Reloading Systemd..."
systemctl daemon-reload
echo "✅ Systemd reloaded"

# Enable services
echo ""
echo "📋 [Step 3/4] Enabling Services (auto-start on boot)..."
systemctl enable spellbee-backend.service
systemctl enable spellbee-frontend.service
systemctl enable spellbee.service
echo "✅ Services enabled for auto-start"

# Setup Nginx
echo ""
echo "📋 [Step 4/4] Configuring Nginx..."

# Copy Nginx config
cp "$SPELLBEE_DIR/nginx.conf" /etc/nginx/sites-available/spellbee
echo "✅ Nginx config copied"

# Create symlink
ln -sf /etc/nginx/sites-available/spellbee /etc/nginx/sites-enabled/spellbee
echo "✅ Nginx site enabled"

# Test Nginx config
echo ""
echo "🔍 Testing Nginx Configuration..."
if nginx -t; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config has errors!"
    echo "   Fix them manually with: sudo nano /etc/nginx/sites-available/spellbee"
    exit 1
fi

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

# Summary
echo ""
echo "========================================"
echo "✨ Setup Complete!"
echo "========================================"
echo ""
echo "📊 Service Status:"
systemctl status spellbee --no-pager
echo ""
echo "🌐 Nginx Sites Enabled:"
ls -la /etc/nginx/sites-enabled/ | grep spellbee
echo ""
echo "✅ Next Steps:"
echo "   1. Make backend startup script executable:"
echo "      chmod +x /root/spellbee/start-backend.sh"
echo ""
echo "   2. Start the services:"
echo "      sudo systemctl start spellbee-backend"
echo "      sudo systemctl start spellbee-frontend"
echo ""
echo "   3. Verify they're running:"
echo "      sudo systemctl status spellbee"
echo ""
echo "   4. Setup SSL certificate:"
echo "      sudo certbot certonly --nginx -d spellbee.pawanpatra.com"
echo ""
echo "========================================"
