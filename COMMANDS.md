# 📋 Complete Command Reference - Spellbee & BookLeaf Deployment

## 🚀 Full Setup (Copy & Paste)

### Phase 1: Prerequisites (Run First)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install all dependencies at once
sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx curl git redis-server

# Verify installations
python3 --version
node --version
npm --version
```

---

### Phase 2: Spellbee Deployment (On Server)

#### 2.1 Clone Repository
```bash
cd /root
git clone https://github.com/YOUR_USER/Spellbee-aivoice-game.git spellbee
cd spellbee
```

#### 2.2 Setup Environment
```bash
# Copy env template
cp .env.example backend/.env

# Edit with your API keys
nano backend/.env

# Add these:
# DEEPGRAM_API_KEY=sk-...
# GOOGLE_API_KEY=...
# PORT=7860
```

#### 2.3 Backend Setup
```bash
cd /root/spellbee/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

#### 2.4 Frontend Setup
```bash
cd /root/spellbee/frontend
npm install
npm run build
```

#### 2.5 Setup Systemd Services
```bash
# Copy service files
sudo cp /root/spellbee/spellbee*.service /etc/systemd/system/

# Reload and enable
sudo systemctl daemon-reload
sudo systemctl enable spellbee-backend.service spellbee-frontend.service spellbee.service

# Start services
sudo systemctl start spellbee-backend.service spellbee-frontend.service

# Verify
sudo systemctl status spellbee
```

#### 2.6 Make startup script executable
```bash
chmod +x /root/spellbee/start-backend.sh
```

---

### Phase 3: Nginx Configuration (For Both Projects)

#### 3.1 Backup current config
```bash
# If BookLeaf already exists
sudo cp /etc/nginx/sites-available/bookleaf /etc/nginx/sites-available/bookleaf.backup
```

#### 3.2 Install combined Nginx config
```bash
# Copy Spellbee config
sudo cp /root/spellbee/nginx.conf /etc/nginx/sites-available/spellbee

# Create symlinks
sudo ln -sf /etc/nginx/sites-available/spellbee /etc/nginx/sites-enabled/spellbee

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Phase 4: SSL Setup (Let's Encrypt)

#### 4.1 Get Certificates
```bash
# For Spellbee
sudo certbot certonly --nginx -d spellbee.pawanpatra.com

# For BookLeaf (if not already done)
sudo certbot certonly --nginx -d support.pawanpatra.com
```

#### 4.2 Verify SSL
```bash
# List all certificates
sudo certbot certificates

# Test both domains
curl -I https://spellbee.pawanpatra.com
curl -I https://support.pawanpatra.com
```

---

## 🔍 Verification & Testing

### Check All Services Running
```bash
# Status of all services
sudo systemctl status spellbee
sudo systemctl status bookleaf

# Detailed status
sudo systemctl status spellbee-backend
sudo systemctl status spellbee-frontend
sudo systemctl status nginx
```

### Health Checks
```bash
# Spellbee backend
curl http://127.0.0.1:7860/api/health

# BookLeaf backend
curl http://127.0.0.1:8000/api/health

# Through Nginx (HTTPS)
curl -I https://spellbee.pawanpatra.com/api/health
curl -I https://support.pawanpatra.com/api/health
```

### Check Ports
```bash
# See all listening ports
sudo ss -tlnp

# Check specific ports
sudo lsof -i :7860  # Spellbee backend
sudo lsof -i :5173  # Spellbee frontend
sudo lsof -i :8000  # BookLeaf backend
sudo lsof -i :3000  # BookLeaf frontend
sudo lsof -i :80    # HTTP
sudo lsof -i :443   # HTTPS
```

---

## 📊 Service Management Commands

### Start/Stop/Restart Services
```bash
# Spellbee
sudo systemctl start spellbee
sudo systemctl stop spellbee
sudo systemctl restart spellbee
sudo systemctl status spellbee

# BookLeaf
sudo systemctl start bookleaf
sudo systemctl stop bookleaf
sudo systemctl restart bookleaf
sudo systemctl status bookleaf

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx  # Reload without dropping connections
```

### Enable/Disable Auto-Start
```bash
# Enable services to start on boot
sudo systemctl enable spellbee spellbee-backend spellbee-frontend
sudo systemctl enable bookleaf

# Disable auto-start
sudo systemctl disable spellbee spellbee-backend
```

### View Service Logs
```bash
# Real-time logs
sudo journalctl -u spellbee-backend -f
sudo journalctl -u spellbee-frontend -f
sudo journalctl -u bookleaf-backend -f

# Last 50 lines
sudo journalctl -u spellbee-backend -n 50

# Combine multiple services
sudo journalctl -u spellbee-backend -u spellbee-frontend -u nginx -f

# Filter by time
sudo journalctl -u spellbee-backend --since "2 hours ago"
sudo journalctl -u spellbee-backend --since "today"
```

---

## 🔧 Configuration Files

### Edit Environment Variables
```bash
# Spellbee
nano /root/spellbee/backend/.env

# BookLeaf
nano /root/bookleaf/backend/.env
```

### Edit Nginx Config
```bash
# Spellbee
sudo nano /etc/nginx/sites-available/spellbee

# BookLeaf
sudo nano /etc/nginx/sites-available/bookleaf

# Test after editing
sudo nginx -t

# Reload if valid
sudo systemctl reload nginx
```

### Edit Systemd Service
```bash
# Spellbee backend service
sudo nano /etc/systemd/system/spellbee-backend.service

# After editing, reload
sudo systemctl daemon-reload
sudo systemctl restart spellbee-backend
```

---

## 🔄 Update & Redeploy

### Update Spellbee Code
```bash
cd /root/spellbee
git pull

# If backend changed
sudo systemctl restart spellbee-backend

# If frontend changed
npm run build
sudo systemctl restart spellbee-frontend

# If both changed
sudo systemctl restart spellbee
```

### Update BookLeaf Code
```bash
cd /root/bookleaf
git pull
sudo systemctl restart bookleaf
```

### Rebuild Frontend
```bash
# Spellbee
cd /root/spellbee/frontend
rm -rf node_modules dist
npm install
npm run build
sudo systemctl restart spellbee-frontend

# BookLeaf
cd /root/bookleaf/frontend
rm -rf node_modules dist
npm install
npm run build
sudo systemctl restart bookleaf-frontend
```

---

## 🔐 SSL Certificate Management

### Renew Certificates
```bash
# Check renewal status
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew

# Force renewal (if needed)
sudo certbot renew --force-renewal

# List all certificates
sudo certbot certificates

# Check certificate details
echo | openssl s_client -servername spellbee.pawanpatra.com -connect spellbee.pawanpatra.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Check Renewal Timer
```bash
# View Certbot renewal schedule
sudo systemctl list-timers certbot

# View Certbot renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## 🛠️ Troubleshooting Commands

### Check What's Using Ports
```bash
# Find what's using a port
sudo lsof -i :7860
sudo lsof -i :5173
sudo lsof -i :80
sudo lsof -i :443

# Kill a process using a port
sudo kill -9 <PID>
```

### Test Nginx Configuration
```bash
# Test syntax
sudo nginx -t

# Show full config (merged from all files)
sudo nginx -T

# Check specific site config
sudo cat /etc/nginx/sites-available/spellbee
```

### Check Database Files
```bash
# Spellbee database
ls -lah /root/spellbee/backend/storage/
ls -lah /root/spellbee/backend/storage/spellbee.db

# BookLeaf database (if using SQLite)
ls -lah /root/bookleaf/backend/storage/
```

### Check Disk Space
```bash
# Overall disk usage
df -h

# Directory sizes
du -sh /root/spellbee
du -sh /root/bookleaf
du -sh /var/log
```

### Check System Resources
```bash
# CPU and memory
top -b -n 1

# Active processes
ps aux | grep -E 'python|node|nginx'

# Network connections
netstat -tlnp

# Running services
systemctl list-units --type=service --state=running
```

---

## 📁 Directory Listing

### View Project Structure
```bash
# Spellbee
tree -L 2 /root/spellbee

# BookLeaf
tree -L 2 /root/bookleaf

# Nginx configs
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Systemd services
ls -la /etc/systemd/system/spellbee*
ls -la /etc/systemd/system/bookleaf*

# Logs
ls -la /var/log/letsencrypt/
```

---

## 💾 Backup Commands

### Backup Configuration
```bash
# Backup Spellbee
tar -czf /root/spellbee-backup-$(date +%Y%m%d).tar.gz /root/spellbee/backend/.env /root/spellbee/frontend/dist

# Backup BookLeaf
tar -czf /root/bookleaf-backup-$(date +%Y%m%d).tar.gz /root/bookleaf/backend/.env

# Backup Nginx configs
tar -czf /root/nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/

# Backup SSL certificates (reference only, Certbot handles renewal)
sudo tar -czf /root/ssl-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```

### Restore Backup
```bash
# Restore Spellbee
tar -xzf /root/spellbee-backup-20260709.tar.gz -C /

# Restore Nginx config
sudo tar -xzf /root/nginx-backup-20260709.tar.gz -C /
```

---

## 🚨 Quick Emergency Commands

### Stop Everything
```bash
sudo systemctl stop spellbee bookleaf nginx
```

### Start Everything
```bash
sudo systemctl start spellbee bookleaf nginx
```

### Restart Everything
```bash
sudo systemctl restart spellbee bookleaf nginx
```

### View All Errors in Last Hour
```bash
sudo journalctl --since "1 hour ago" --priority=err
```

### Clear Nginx Cache
```bash
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

### Reset Nginx Config to Safe State
```bash
sudo systemctl stop nginx
sudo cp /etc/nginx/nginx.conf.default /etc/nginx/nginx.conf
sudo systemctl start nginx
```

---

## 📞 Common Issues & Quick Fixes

### Port 80 Already in Use
```bash
# Find what's using it
sudo lsof -i :80

# Kill it
sudo kill -9 <PID>

# Or use different port in config
sudo sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/sites-available/spellbee
```

### Backend Not Starting
```bash
# Check logs
sudo journalctl -u spellbee-backend -n 50

# Check .env file
cat /root/spellbee/backend/.env

# Test backend manually
cd /root/spellbee/backend
source venv/bin/activate
python app/main.py
```

### Frontend Blank Page
```bash
# Check frontend logs
sudo journalctl -u spellbee-frontend -f

# Rebuild frontend
cd /root/spellbee/frontend
npm run build

# Check if dist folder exists
ls -la /root/spellbee/frontend/dist/
```

### SSL Certificate Error
```bash
# Test Nginx config
sudo nginx -t

# Check certificate file exists
ls -la /etc/letsencrypt/live/spellbee.pawanpatra.com/

# Renew certificate
sudo certbot renew --force-renewal

# Check certificate validity
echo | openssl s_client -servername spellbee.pawanpatra.com -connect spellbee.pawanpatra.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## ✨ Useful One-Liners

```bash
# Deploy everything in one go (after setup)
cd /root/spellbee && git pull && npm run build --prefix frontend && sudo systemctl restart spellbee

# Check all service status with colors
sudo systemctl status spellbee bookleaf nginx --no-pager

# Monitor all logs live
sudo journalctl -u spellbee-backend -u spellbee-frontend -u bookleaf-backend -u bookleaf-frontend -u nginx -f

# Restart on any error
while true; do sudo systemctl restart spellbee && sleep 10 || break; done

# Full health check
echo "Spellbee:" && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://spellbee.pawanpatra.com && echo "BookLeaf:" && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://support.pawanpatra.com
```

---

**Last Updated:** July 2026  
**Projects:** Spellbee + BookLeaf  
**Environment:** Linux (Ubuntu/Debian)
