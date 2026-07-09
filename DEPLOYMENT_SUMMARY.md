# 🎯 Spellbee & BookLeaf Deployment - Complete Summary

## 📦 Files Created for Deployment

All files are in `/Users/pawanpersonal/Documents/GitHub/Spellbee-aivoice-game/`

| File | Purpose |
|------|---------|
| **spellbee-backend.service** | Systemd service for FastAPI backend (port 7860) |
| **spellbee-frontend.service** | Systemd service for React frontend (port 5173) |
| **spellbee.service** | Meta-service to manage both services |
| **start-backend.sh** | Startup script for backend with venv activation |
| **nginx.conf** | Combined Nginx config for both BookLeaf & Spellbee |
| **DEPLOY_BOTH.md** | Detailed step-by-step deployment guide |
| **COMMANDS.md** | Complete command reference (copy-paste ready) |
| **SSL_SETUP.md** | SSL certificate setup & troubleshooting |
| **DEPLOYMENT_SUMMARY.md** | This file |

---

## 🌐 Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│             NGINX (Reverse Proxy - Port 80/443)         │
├──────────────────────────────────────────────────────────┤
│                                                         │
│  support.pawanpatra.com        spellbee.pawanpatra.com │
│  (BookLeaf)                    (Spellbee)              │
│         │                              │                │
│    ┌────┴────┐                    ┌────┴────┐          │
│    ▼         ▼                    ▼         ▼          │
│  :3000    :8000                :5173    :7860          │
│  FE       BE                   FE       BE             │
│                                                         │
└────────────────────────────────────────────────────────┘

Ports:
- BookLeaf:  Backend 8000, Frontend 3000
- Spellbee:  Backend 7860, Frontend 5173
- Nginx:     HTTP 80, HTTPS 443
```

---

## ⚡ Quick Start on Server

### Copy-Paste This Entire Block:

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx curl git redis-server

# 2. Clone Spellbee
cd /root
git clone https://github.com/YOUR_USER/Spellbee-aivoice-game.git spellbee
cd spellbee

# 3. Setup environment
cp .env.example backend/.env
# EDIT: nano backend/.env (add your API keys)

# 4. Backend setup
cd /root/spellbee/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 5. Frontend setup
cd /root/spellbee/frontend
npm install
npm run build

# 6. Install services
sudo cp /root/spellbee/spellbee*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable spellbee-backend spellbee-frontend spellbee
sudo systemctl start spellbee-backend spellbee-frontend

# 7. Configure Nginx
sudo cp /root/spellbee/nginx.conf /etc/nginx/sites-available/spellbee
sudo ln -sf /etc/nginx/sites-available/spellbee /etc/nginx/sites-enabled/spellbee
sudo nginx -t
sudo systemctl reload nginx

# 8. Setup SSL
sudo certbot certonly --nginx -d spellbee.pawanpatra.com

# 9. Verify
curl https://spellbee.pawanpatra.com/api/health
curl https://support.pawanpatra.com/api/health
```

---

## 📚 Documentation Files (Read in Order)

1. **DEPLOYMENT_SUMMARY.md** (this file) - Overview & quick start
2. **DEPLOY_BOTH.md** - Detailed step-by-step guide
3. **COMMANDS.md** - All commands for setup, management, troubleshooting
4. **SSL_SETUP.md** - SSL/HTTPS configuration details

---

## 🔧 Configuration Files

### Environment Variables
```bash
# Location: /root/spellbee/backend/.env
DEEPGRAM_API_KEY=sk-...
GOOGLE_API_KEY=...
PORT=7860
STUN_SERVER=stun:stun.l.google.com:19302
```

### Systemd Services
```bash
# Locations:
/etc/systemd/system/spellbee-backend.service
/etc/systemd/system/spellbee-frontend.service
/etc/systemd/system/spellbee.service
/etc/systemd/system/bookleaf*.service
```

### Nginx Reverse Proxy
```bash
# Locations:
/etc/nginx/sites-available/spellbee
/etc/nginx/sites-available/bookleaf
/etc/nginx/sites-enabled/spellbee
/etc/nginx/sites-enabled/bookleaf
```

### SSL Certificates
```bash
# Locations:
/etc/letsencrypt/live/spellbee.pawanpatra.com/
/etc/letsencrypt/live/support.pawanpatra.com/
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Have Deepgram API key ready
- [ ] Have Google Gemini API key ready
- [ ] DNS points spellbee.pawanpatra.com to server IP
- [ ] DNS points support.pawanpatra.com to server IP (already done for BookLeaf)
- [ ] Ports 80, 443 open in firewall
- [ ] Server has at least 2GB RAM, 10GB disk

During deployment:
- [ ] Git clone successful
- [ ] Environment variables set in backend/.env
- [ ] Python venv activated and dependencies installed
- [ ] npm install and npm run build completed
- [ ] Systemd services copied and enabled
- [ ] Nginx config valid (sudo nginx -t passes)
- [ ] SSL certificates obtained (certbot)

After deployment:
- [ ] Services show as running (sudo systemctl status spellbee)
- [ ] Health endpoints respond (curl /api/health)
- [ ] HTTPS works (https://spellbee.pawanpatra.com)
- [ ] No errors in logs (sudo journalctl -u spellbee-backend -f)
- [ ] Both projects accessible on server

---

## 🚀 Service Management

### View Status
```bash
sudo systemctl status spellbee
sudo systemctl status bookleaf
```

### Start/Stop
```bash
sudo systemctl start spellbee
sudo systemctl stop spellbee
sudo systemctl restart spellbee
```

### View Logs
```bash
sudo journalctl -u spellbee-backend -f
sudo journalctl -u spellbee-frontend -f
sudo journalctl -u nginx -f
```

---

## 🔐 Security Notes

✅ **Already Configured:**
- HTTPS with Let's Encrypt SSL
- HTTP → HTTPS redirect
- Role-based access control
- API key handling (server-side only)

⚠️ **For Production:**
- Configure firewall rules
- Setup monitoring/alerting
- Enable audit logging
- Setup backups for databases
- Monitor certificate renewal

---

## 📊 Port Reference

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Spellbee Backend | 7860 | HTTP (localhost) | Internal only |
| Spellbee Frontend | 5173 | HTTP (localhost) | Internal only |
| BookLeaf Backend | 8000 | HTTP (localhost) | Internal only |
| BookLeaf Frontend | 3000 | HTTP (localhost) | Internal only |
| Nginx | 80 | HTTP | Public (redirects to 443) |
| Nginx | 443 | HTTPS | Public (production access) |
| Redis | 6379 | Internal | Bookleaf Celery tasks only |

---

## 🔍 Quick Troubleshooting

### Backend not starting?
```bash
sudo journalctl -u spellbee-backend -n 50
cat /root/spellbee/backend/.env
source /root/spellbee/backend/venv/bin/activate
python /root/spellbee/backend/app/main.py
```

### Frontend blank page?
```bash
sudo journalctl -u spellbee-frontend -f
ls /root/spellbee/frontend/dist/
cd /root/spellbee/frontend && npm run build
```

### HTTPS not working?
```bash
sudo certbot certificates
sudo nginx -t
sudo systemctl reload nginx
curl -I https://spellbee.pawanpatra.com
```

### Can't connect to API?
```bash
curl http://127.0.0.1:7860/api/health
curl https://spellbee.pawanpatra.com/api/health
sudo lsof -i :7860
```

---

## 📞 File Locations on Server

After deployment, files will be at:

```
/root/spellbee/
├── backend/
│   ├── .env              ← Your config file
│   ├── venv/             ← Python virtual environment
│   ├── app/
│   ├── requirements.txt
│   └── start-backend.sh  ← Startup script
│
├── frontend/
│   ├── node_modules/
│   ├── dist/             ← Built frontend (served by Nginx)
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── spellbee-backend.service    ← Systemd service files
├── spellbee-frontend.service
├── spellbee.service
├── nginx.conf
├── DEPLOY_BOTH.md
├── COMMANDS.md
├── SSL_SETUP.md
└── .env.example

/etc/systemd/system/
├── spellbee-backend.service
├── spellbee-frontend.service
├── spellbee.service
└── bookleaf*.service

/etc/nginx/sites-available/
├── spellbee              ← Your Nginx config
└── bookleaf              ← BookLeaf config

/etc/letsencrypt/live/
├── spellbee.pawanpatra.com/
│   ├── fullchain.pem     ← SSL certificate
│   ├── privkey.pem       ← SSL private key
│   └── ...
└── support.pawanpatra.com/
```

---

## 🎯 Next Steps After Deployment

1. **Test Both Applications**
   - Visit https://spellbee.pawanpatra.com
   - Visit https://support.pawanpatra.com
   - Click "Start Game" in Spellbee
   - Login to BookLeaf

2. **Monitor Logs**
   - `sudo journalctl -u spellbee-backend -f`
   - `sudo journalctl -u bookleaf-backend -f`

3. **Setup Backups**
   - Database backups (if using databases)
   - .env file backups
   - Configuration backups

4. **Configure Monitoring**
   - Setup uptime monitoring
   - Configure alerts for service failures
   - Monitor disk usage

5. **Document Changes**
   - Record API keys stored safely
   - Document server IP and DNS setup
   - Keep SSL renewal dates in calendar

---

## 📖 Reading Order

For first-time deployment, read in this order:
1. This file (DEPLOYMENT_SUMMARY.md)
2. DEPLOY_BOTH.md (detailed steps)
3. COMMANDS.md (when executing)
4. SSL_SETUP.md (for SSL issues)

For troubleshooting:
1. COMMANDS.md (Troubleshooting section)
2. SSL_SETUP.md (SSL issues)
3. DEPLOY_BOTH.md (specific service issues)

---

## 🎉 Success Indicators

After successful deployment, you should see:

✅ Services running:
```
sudo systemctl status spellbee bookleaf nginx
● spellbee.service - Spellbee Application
  Active: active (exited)
● bookleaf.service - BookLeaf Application
  Active: active (exited)
● nginx.service - NGINX HTTP Server
  Active: active (running)
```

✅ Health endpoints responding:
```
curl https://spellbee.pawanpatra.com/api/health
curl https://support.pawanpatra.com/api/health
# Both return HTTP 200
```

✅ Websites accessible:
- https://spellbee.pawanpatra.com - Spellbee voice game
- https://support.pawanpatra.com - BookLeaf portal

✅ SSL working:
```
echo | openssl s_client -servername spellbee.pawanpatra.com -connect spellbee.pawanpatra.com:443 2>/dev/null | grep "Issuer"
# Shows: Issuer: CN = Let's Encrypt
```

✅ No errors in logs:
```
sudo journalctl -u spellbee-backend --since "10 minutes ago"
# Shows normal startup messages, no errors
```

---

## 💡 Tips

- Keep terminal window open showing `journalctl -f` during deployment
- Test each step before moving to next
- Save all command outputs for debugging
- Backup .env files in multiple locations
- Test SSL renewal with `sudo certbot renew --dry-run`
- Monitor disk usage: `df -h`
- Check logs regularly: `sudo journalctl -p err`

---

**Deployment Guide Created:** July 9, 2026  
**Projects:** Spellbee + BookLeaf  
**Server OS:** Ubuntu/Debian Linux  
**Support:** Check COMMANDS.md for troubleshooting
