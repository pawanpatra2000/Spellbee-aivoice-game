# 🚀 Dual Project Deployment Guide
## BookLeaf + Spellbee on Same Server

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   NGINX Reverse Proxy (Port 80/443)          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  support.pawanpatra.com      spellbee.pawanpatra.com        │
│         │                              │                     │
│         ├─ Frontend:3000               ├─ Frontend:5173      │
│         ├─ Backend:8000/api            ├─ Backend:7860/api   │
│         │                              │                     │
└─────────────────────────────────────────────────────────────┘

Projects running on separate ports:
- BookLeaf:  Backend 8000, Frontend 3000
- Spellbee:  Backend 7860, Frontend 5173
```

---

## 🔧 Prerequisites

On your server, ensure you have:
```bash
# System packages
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx curl git redis-server

# Verify versions
python3 --version     # 3.10+
node --version        # 18+
npm --version         # 9+
```

---

## 📂 Directory Structure on Server

```
/root/
├── bookleaf/           # Already deployed
│   ├── backend/
│   ├── frontend/
│   └── .env
│
└── spellbee/           # New deployment
    ├── backend/
    ├── frontend/
    ├── .env
    ├── start-backend.sh
    ├── spellbee-backend.service
    ├── spellbee-frontend.service
    └── spellbee.service
```

---

## 🎯 Step-by-Step Deployment

### Step 1: SSH into Server
```bash
ssh root@your_server_ip
cd /root
```

### Step 2: Clone Spellbee Repository
```bash
git clone https://github.com/YOUR_USER/Spellbee-aivoice-game.git spellbee
cd spellbee
```

### Step 3: Create Environment File
```bash
cp .env.example backend/.env
nano backend/.env
```

Fill in your API keys:
```env
DEEPGRAM_API_KEY=sk-...your_key...
GOOGLE_API_KEY=your_gemini_key
DEEPGRAM_TTS_VOICE=aura-asteria-en
DEEPGRAM_STT_MODEL=nova-2
GOOGLE_MODEL=gemini-2.0-flash
HOST=0.0.0.0
PORT=7860
DATABASE_PATH=/root/spellbee/backend/storage/spellbee.db
STUN_SERVER=stun:stun.l.google.com:19302
```

### Step 4: Setup Backend (Python)
```bash
cd /root/spellbee/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

deactivate
```

### Step 5: Setup Frontend (React)
```bash
cd /root/spellbee/frontend

# Install and build
npm install
npm run build

# For production, we'll use vite preview via systemd
```

### Step 6: Create Startup Script
```bash
chmod +x /root/spellbee/start-backend.sh
```

### Step 7: Install Systemd Services
```bash
# Copy service files
sudo cp /root/spellbee/spellbee*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services (auto-start on boot)
sudo systemctl enable spellbee-backend.service
sudo systemctl enable spellbee-frontend.service
sudo systemctl enable spellbee.service

# Start services
sudo systemctl start spellbee-backend.service
sudo systemctl start spellbee-frontend.service

# Verify they're running
sudo systemctl status spellbee
```

### Step 8: Update Nginx Configuration
```bash
# Backup existing nginx config
sudo cp /etc/nginx/sites-available/bookleaf /etc/nginx/sites-available/bookleaf.backup

# Copy the new combined nginx config
sudo cp /root/spellbee/nginx.conf /etc/nginx/sites-available/spellbee

# Create symlinks
sudo ln -sf /etc/nginx/sites-available/spellbee /etc/nginx/sites-enabled/spellbee

# Update bookleaf config (if using the combined one)
sudo cp /root/bookleaf/nginx.conf /etc/nginx/sites-available/bookleaf

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 9: Setup SSL Certificates
```bash
# For Spellbee (new domain)
sudo certbot certonly --nginx -d spellbee.pawanpatra.com

# For BookLeaf (already done, but renew if needed)
sudo certbot renew

# List all certificates
sudo certbot certificates
```

### Step 10: Verify Deployment
```bash
# Check Nginx is running
sudo systemctl status nginx

# Check Spellbee services
sudo systemctl status spellbee-backend
sudo systemctl status spellbee-frontend

# Check BookLeaf services (if using systemd)
sudo systemctl status bookleaf

# View logs
sudo journalctl -u spellbee-backend -f
sudo journalctl -u spellbee-frontend -f

# Test health endpoints
curl https://spellbee.pawanpatra.com/api/health
curl https://support.pawanpatra.com/api/health
```

---

## 📊 Ports Configuration

| Project | Service | Port | Purpose |
|---------|---------|------|---------|
| **BookLeaf** | Backend | 8000 | FastAPI |
| | Frontend | 3000 | Vite Preview |
| **Spellbee** | Backend | 7860 | FastAPI |
| | Frontend | 5173 | Vite Preview |
| **Nginx** | HTTP | 80 | Redirects to HTTPS |
| | HTTPS | 443 | SSL proxy |

---

## 🌐 Domain Routing

### support.pawanpatra.com → BookLeaf
```
GET  /              → 3000 (React frontend)
POST /api/v1/...    → 8000 (FastAPI backend)
WS   /api/v1/ws/    → 8000 (WebSocket)
```

### spellbee.pawanpatra.com → Spellbee
```
GET  /              → 5173 (React frontend)
POST /api/...       → 7860 (FastAPI backend)
WS   /api/ws/       → 7860 (WebSocket for voice)
```

---

## 🔍 Monitoring & Maintenance

### View Live Logs
```bash
# Spellbee backend
sudo journalctl -u spellbee-backend -f

# Spellbee frontend
sudo journalctl -u spellbee-frontend -f

# BookLeaf backend
sudo journalctl -u bookleaf-backend -f

# Nginx
sudo journalctl -u nginx -f
```

### Restart Services
```bash
# Restart Spellbee
sudo systemctl restart spellbee

# Restart just backend
sudo systemctl restart spellbee-backend

# Restart Nginx (after config changes)
sudo systemctl reload nginx
```

### Health Checks
```bash
# BookLeaf
curl -I https://support.pawanpatra.com/api/health

# Spellbee
curl -I https://spellbee.pawanpatra.com/api/health

# Check Nginx config
sudo nginx -t
```

### Update Code
```bash
# BookLeaf
cd /root/bookleaf
git pull
sudo systemctl restart bookleaf

# Spellbee
cd /root/spellbee
git pull
sudo systemctl restart spellbee-backend
npm run build  # if frontend changed
sudo systemctl restart spellbee-frontend
```

---

## 🔐 SSL Certificate Management

### Auto-renew (automatic via Certbot)
```bash
# Check renewal status
sudo certbot renew --dry-run

# View all certificates
sudo certbot certificates

# Renew manually if needed
sudo certbot renew
```

### Certificate Locations
```
/etc/letsencrypt/live/support.pawanpatra.com/
/etc/letsencrypt/live/spellbee.pawanpatra.com/
```

---

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Check which service is using the port
sudo lsof -i :8000
sudo lsof -i :7860
sudo lsof -i :3000
sudo lsof -i :5173

# Kill the process (if needed)
sudo kill -9 <PID>
```

### Nginx Config Errors
```bash
# Test syntax
sudo nginx -t

# Check active config
sudo nginx -T

# Check for typos in sites-available
sudo cat /etc/nginx/sites-available/spellbee
```

### Services Not Starting
```bash
# Check service logs
sudo journalctl -u spellbee-backend -n 50

# Check if .env is readable
ls -la /root/spellbee/backend/.env

# Verify port is open
sudo ss -tlnp | grep 7860
```

### Frontend Not Building
```bash
# Rebuild frontend
cd /root/spellbee/frontend
rm -rf node_modules dist
npm install
npm run build

# Restart frontend service
sudo systemctl restart spellbee-frontend
```

### Backend Can't Connect to Database
```bash
# Check if database file path is correct in .env
cat /root/spellbee/backend/.env | grep DATABASE

# Ensure directory exists
mkdir -p /root/spellbee/backend/storage
```

---

## 📋 Checklist Before Going Live

- [ ] DNS for spellbee.pawanpatra.com points to server IP
- [ ] backend/.env has valid API keys (Deepgram, Google Gemini)
- [ ] Port 80 and 443 open in firewall
- [ ] SSH access to server working
- [ ] Both systemd services enabled (`systemctl enable`)
- [ ] SSL certificates installed (`sudo certbot certificates`)
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Health endpoints responding
- [ ] Logs showing no errors (`journalctl`)

---

## 🎉 Testing Both Projects

### Test BookLeaf
```bash
# Visit in browser
https://support.pawanpatra.com

# Login as admin
Email: admin@Support.in
Password: admin123

# Check API
curl https://support.pawanpatra.com/api/v1/auth/me -H "Authorization: Bearer <your_token>"
```

### Test Spellbee
```bash
# Visit in browser
https://spellbee.pawanpatra.com

# Click "Start Game"
# Allow microphone
# Start spelling!

# Check API
curl https://spellbee.pawanpatra.com/api/health
```

---

## 🚀 Quick Reference Commands

```bash
# All services status
sudo systemctl status bookleaf spellbee

# Start/stop/restart all
sudo systemctl start|stop|restart spellbee bookleaf

# View combined logs
sudo journalctl -u spellbee-backend -u spellbee-frontend -u bookleaf -f

# Restart Nginx after changes
sudo systemctl reload nginx

# Check all ports listening
sudo ss -tlnp

# Clear Nginx cache
sudo rm -rf /var/cache/nginx/*

# Certificate renewal
sudo certbot renew --force-renewal
```

---

## 📞 Support

If you encounter issues:

1. **Check logs first:** `sudo journalctl -u <service> -f`
2. **Test endpoints:** `curl -I https://domain.com/api/health`
3. **Verify .env:** `cat /root/<project>/backend/.env`
4. **Nginx config:** `sudo nginx -t`
5. **Systemd status:** `sudo systemctl status <service>`

---

**Last Updated:** July 2026  
**Projects:** BookLeaf + Spellbee  
**Server:** Linux (Ubuntu/Debian)
