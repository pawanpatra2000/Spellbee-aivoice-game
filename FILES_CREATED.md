# 📋 Files Created for Spellbee & BookLeaf Deployment

## 🎯 Summary

Created **9 deployment files** to setup Spellbee alongside existing BookLeaf on the same server.

---

## 📂 Deployment Files (All in root directory)

### 🔧 Systemd Service Files (Copy to `/etc/systemd/system/`)

```
✓ spellbee-backend.service
  └─ Runs FastAPI backend on port 7860
  └─ Auto-restart on crash
  └─ Runs: venv/bin/uvicorn app.main:app --port 7860

✓ spellbee-frontend.service
  └─ Runs Vite preview on port 5173
  └─ Auto-restart on crash
  └─ Runs: vite preview --port 5173

✓ spellbee.service
  └─ Meta-service managing backend + frontend
  └─ Enable this to start both
```

### 🚀 Startup Scripts (Make executable)

```
✓ start-backend.sh
  └─ Loads .env and starts backend
  └─ Used by spellbee-backend.service
  └─ chmod +x start-backend.sh
```

### 🌐 Nginx Configuration (Copy to `/etc/nginx/sites-available/`)

```
✓ nginx.conf
  └─ Reverse proxy for BOTH projects
  └─ BookLeaf:  support.pawanpatra.com → :3000 & :8000
  └─ Spellbee:  spellbee.pawanpatra.com → :5173 & :7860
  └─ SSL/HTTPS configured
  └─ WebSocket support included
```

### 📚 Documentation Files

```
✓ DEPLOYMENT_SUMMARY.md ⭐ START HERE
  └─ Overview, quick start, architecture
  └─ 10 min read, has copy-paste commands

✓ DEPLOY_BOTH.md
  └─ Detailed step-by-step guide
  └─ Every step explained
  └─ Troubleshooting included

✓ COMMANDS.md
  └─ Complete command reference
  └─ Service management
  └─ Monitoring & logs
  └─ Troubleshooting commands

✓ SSL_SETUP.md
  └─ SSL/HTTPS configuration
  └─ Let's Encrypt setup
  └─ Certificate renewal
  └─ Troubleshooting

✓ FILES_CREATED.md (this file)
  └─ Index of all created files
  └─ What each file does
```

---

## 📊 File Purposes

| File | Type | Destination | Purpose |
|------|------|-------------|---------|
| spellbee-backend.service | Systemd | `/etc/systemd/system/` | Run FastAPI backend |
| spellbee-frontend.service | Systemd | `/etc/systemd/system/` | Run React frontend |
| spellbee.service | Systemd | `/etc/systemd/system/` | Manage both services |
| start-backend.sh | Script | `/root/spellbee/` | Backend startup wrapper |
| nginx.conf | Config | `/etc/nginx/sites-available/` | Reverse proxy (both projects) |
| DEPLOYMENT_SUMMARY.md | Docs | Reference | Quick start guide |
| DEPLOY_BOTH.md | Docs | Reference | Detailed guide |
| COMMANDS.md | Docs | Reference | Command reference |
| SSL_SETUP.md | Docs | Reference | SSL configuration |

---

## 🎯 How to Use These Files

### Step 1: Copy Service Files to Server
```bash
scp spellbee-*.service root@your_server:/root/spellbee/
# On server:
sudo cp /root/spellbee/spellbee-*.service /etc/systemd/system/
sudo systemctl daemon-reload
```

### Step 2: Copy Nginx Config
```bash
scp nginx.conf root@your_server:/root/spellbee/
# On server:
sudo cp /root/spellbee/nginx.conf /etc/nginx/sites-available/spellbee
sudo ln -sf /etc/nginx/sites-available/spellbee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Make Startup Script Executable
```bash
chmod +x start-backend.sh
# On server:
chmod +x /root/spellbee/start-backend.sh
```

### Step 4: Follow Documentation
- Read `DEPLOYMENT_SUMMARY.md` first (overview)
- Follow steps in `DEPLOY_BOTH.md` (detailed guide)
- Reference `COMMANDS.md` when executing
- Use `SSL_SETUP.md` for SSL issues

---

## 🔍 File Contents Summary

### spellbee-backend.service
```ini
[Unit]
Description=Spellbee Backend (FastAPI / uvicorn)
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/spellbee/backend
ExecStart=/bin/bash /root/spellbee/start-backend.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**What it does:** Starts FastAPI backend on port 7860, auto-restarts on crash

---

### spellbee-frontend.service
```ini
[Unit]
Description=Spellbee React Frontend (Vite Preview)
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/spellbee/frontend
ExecStart=/root/spellbee/frontend/node_modules/.bin/vite preview --host 127.0.0.1 --port 5173
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**What it does:** Runs Vite preview server on port 5173, serves React build

---

### spellbee.service
```ini
[Unit]
Description=Spellbee Application (Backend + Frontend)
Requires=spellbee-backend.service spellbee-frontend.service
After=spellbee-backend.service spellbee-frontend.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/true

[Install]
WantedBy=multi-user.target
```

**What it does:** Meta-service to manage both backend and frontend together

---

### start-backend.sh
```bash
#!/bin/bash
cd /root/spellbee/backend

if [ -f .env ]; then
    set -a && source .env && set +a
fi

exec venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 7860 \
    --workers 2 \
    --log-level info
```

**What it does:** Loads environment variables and starts backend

---

### nginx.conf (Excerpt)
```nginx
# Spellbee Server
server {
    listen 443 ssl http2;
    server_name spellbee.pawanpatra.com;
    
    location / {
        proxy_pass http://127.0.0.1:5173;  # Frontend
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:7860;  # Backend
    }
    
    # WebSocket support
    location /api/ws/ {
        proxy_pass http://127.0.0.1:7860;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# BookLeaf Server (also configured)
server {
    listen 443 ssl http2;
    server_name support.pawanpatra.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;  # Frontend
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;  # Backend
    }
}
```

**What it does:** Routes both projects, handles HTTPS, proxies to backends

---

## 📖 Documentation Overview

### DEPLOYMENT_SUMMARY.md (⭐ Start here)
- **Length:** ~5-10 minutes read
- **Contains:** Overview, quick start, checklist
- **Best for:** First-time setup, understanding architecture
- **Has:** Copy-paste command block

### DEPLOY_BOTH.md
- **Length:** ~15-20 minutes read
- **Contains:** Step-by-step instructions
- **Best for:** Detailed walkthroughs with explanations
- **Has:** Troubleshooting section

### COMMANDS.md
- **Length:** Reference (use as needed)
- **Contains:** All commands organized by category
- **Best for:** Executing commands, management
- **Has:** Service management, monitoring, troubleshooting

### SSL_SETUP.md
- **Length:** ~10 minutes
- **Contains:** SSL certificate setup
- **Best for:** Implementing HTTPS
- **Has:** Troubleshooting SSL issues

---

## 🔄 Deployment Workflow

```
1. Read DEPLOYMENT_SUMMARY.md
   ↓
2. Follow DEPLOY_BOTH.md steps
   ↓
3. Copy service files to /etc/systemd/system/
   ↓
4. Copy nginx.conf to /etc/nginx/sites-available/
   ↓
5. Enable & start services
   ↓
6. Setup SSL using SSL_SETUP.md
   ↓
7. Verify using COMMANDS.md health checks
   ↓
✅ Done! Access https://spellbee.pawanpatra.com
```

---

## ✅ Verification Checklist

After using these files, verify:

```bash
# Check services are running
sudo systemctl status spellbee

# Check ports are listening
sudo ss -tlnp | grep -E '7860|5173'

# Test health endpoints
curl http://127.0.0.1:7860/api/health
curl https://spellbee.pawanpatra.com/api/health

# Check Nginx is configured
sudo nginx -t
sudo grep -A 2 "spellbee.pawanpatra.com" /etc/nginx/sites-enabled/spellbee

# Check SSL certificates
sudo certbot certificates | grep spellbee
```

All should show success/running status.

---

## 🚨 If Something Goes Wrong

1. **Check which file caused the issue**
   - Service not starting? → Check spellbee-*.service files
   - Frontend/backend not accessible? → Check nginx.conf
   - SSL issues? → Check SSL_SETUP.md

2. **Read the corresponding documentation**
   - `DEPLOY_BOTH.md` → Troubleshooting section
   - `COMMANDS.md` → Troubleshooting section
   - `SSL_SETUP.md` → Troubleshooting section

3. **Run diagnostic commands** from COMMANDS.md
   - `sudo systemctl status spellbee`
   - `sudo journalctl -u spellbee-backend -f`
   - `sudo nginx -t`

---

## 📋 File Locations After Deployment

```
On Your Computer:
├── spellbee-backend.service       ← This repo
├── spellbee-frontend.service      ← This repo
├── spellbee.service               ← This repo
├── start-backend.sh               ← This repo
├── nginx.conf                     ← This repo
├── DEPLOYMENT_SUMMARY.md          ← This repo
├── DEPLOY_BOTH.md                 ← This repo
├── COMMANDS.md                    ← This repo
└── SSL_SETUP.md                   ← This repo

On Server After Deployment:
/etc/systemd/system/
├── spellbee-backend.service       ← Copied from repo
├── spellbee-frontend.service      ← Copied from repo
└── spellbee.service               ← Copied from repo

/etc/nginx/sites-available/
└── spellbee                       ← Copied nginx.conf

/root/spellbee/
├── start-backend.sh               ← Copied and made executable
└── backend/.env                   ← Created manually with your keys
```

---

## 🎉 Success!

Once all files are in place and you've followed the guides:

✅ Both projects running:
- https://spellbee.pawanpatra.com (Spellbee voice game)
- https://support.pawanpatra.com (BookLeaf support portal)

✅ Auto-restart on crash
✅ HTTPS/SSL enabled
✅ Nginx reverse proxy working
✅ WebSocket support active

---

## 📞 Quick Reference

| Need | File to Read |
|------|--------------|
| Quick overview | DEPLOYMENT_SUMMARY.md |
| Step-by-step guide | DEPLOY_BOTH.md |
| Specific commands | COMMANDS.md |
| SSL issues | SSL_SETUP.md |
| Service files | spellbee-*.service |
| Nginx config | nginx.conf |
| Start backend | start-backend.sh |

---

**Files Created:** July 9, 2026  
**Total Files:** 9 deployment files  
**Ready to Deploy:** ✅ Yes  
**Documentation:** Complete  
**Time to Deploy:** ~30-45 minutes
