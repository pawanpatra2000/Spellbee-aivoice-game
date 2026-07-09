# VM Deployment Guide

This directory contains everything needed to deploy the Spellbee AI Voice Game to a VM using systemd and Nginx.

**Domain:** `spellbee.pawanpatra.com`  
**Note:** Repository should already be present at `/opt/spellbee-aivoice` on the VM

## Quick Start

### 1. Prepare the VM

```bash
# SSH into your VM
ssh root@your-vm-ip

# Copy the repository to /opt/spellbee-aivoice
# (Assuming you have it locally or via SCP)
scp -r ~/Spellbee-aivoice-game root@your-vm-ip:/opt/spellbee-aivoice
```

### 2. Run the Deployment Script

```bash
cd /opt/spellbee-aivoice/deployment

# Run deployment script
sudo bash deploy.sh /opt/spellbee-aivoice
```

The script will:
- Install all system dependencies (Python 3.12, Node.js, Nginx)
- Create an `appuser` service account
- Build the frontend
- Install Python dependencies
- Setup the systemd service
- Configure Nginx as a reverse proxy

### 3. Configure Environment Variables

Edit `/etc/spellbee-aivoice/.env` and add your API keys:

```bash
sudo nano /etc/spellbee-aivoice/.env
```

Required variables:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `LLM_MODEL` - Model to use (default: gemini-3.1-flash-lite-preview)

After updating, restart the service:
```bash
sudo systemctl restart spellbee-aivoice
```

### 4. Configure SSL (Later)

When ready, configure SSL/HTTPS by:

1. Getting Let's Encrypt certificate:
```bash
sudo certbot certonly -d spellbee.pawanpatra.com
```

2. Update `/etc/nginx/sites-available/spellbee-aivoice` with SSL configuration

3. Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## File Structure

```
deployment/
├── deploy.sh              # Main deployment script
├── spellbee-aivoice.service  # Systemd service file
├── nginx.conf             # Nginx reverse proxy config
└── README.md              # This file
```

## Service Management

```bash
# View service status
sudo systemctl status spellbee-aivoice

# View real-time logs
sudo journalctl -u spellbee-aivoice -f

# Restart the service
sudo systemctl restart spellbee-aivoice

# Stop the service
sudo systemctl stop spellbee-aivoice

# Start the service
sudo systemctl start spellbee-aivoice
```

## Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload Nginx (without restarting)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP/HTTPS:80/443
       ▼
┌─────────────────────────┐
│   Nginx Reverse Proxy   │
│   (Port 80/443)         │
└──────────┬──────────────┘
           │ HTTP:8000 (localhost)
           ▼
┌─────────────────────────────────────┐
│   Systemd Service (spellbee-aivoice)│
│   FastAPI Backend (Uvicorn)         │
│   ├─ Python Backend (Port 8000)     │
│   └─ Static Frontend Files          │
└─────────────────────────────────────┘
```

## Storage Locations

- **Application**: `/opt/spellbee-aivoice`
- **Environment Config**: `/etc/spellbee-aivoice/.env`
- **Systemd Service**: `/etc/systemd/system/spellbee-aivoice.service`
- **Nginx Config**: `/etc/nginx/sites-available/spellbee-aivoice`
- **Logs**: `journalctl -u spellbee-aivoice` (systemd journal)
- **Storage**: `/opt/spellbee-aivoice/backend/storage` (uploads/outputs)

## Troubleshooting

### Service won't start
```bash
# Check logs
sudo journalctl -u spellbee-aivoice -n 50

# Check if port 8000 is already in use
sudo lsof -i :8000
```

### Nginx errors
```bash
# Test configuration syntax
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### API connection issues
```bash
# Test backend directly
curl http://localhost:8000/docs

# Check if service is running
sudo systemctl status spellbee-aivoice
```

### Storage permission errors
```bash
# Ensure appuser owns the storage directory
sudo chown -R appuser:appuser /opt/spellbee-aivoice/backend/storage
```

## Updates

To update the application:

```bash
cd /opt/spellbee-aivoice
sudo -u appuser git fetch origin
sudo -u appuser git checkout main
sudo -u appuser git pull origin main

# Rebuild frontend if needed
cd frontend
npm install
npm run build
cp -r dist ../backend/static

# Reinstall dependencies if requirements.txt changed
cd ../backend
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl restart spellbee-aivoice
```

## Security Considerations

1. **Change default user**: The service runs as `appuser`, not root
2. **Restrict file permissions**: `/etc/spellbee-aivoice/.env` has 600 permissions
3. **Firewall**: Configure firewall rules to only allow HTTP/HTTPS
4. **SSL/TLS**: Always use HTTPS in production
5. **API Keys**: Never commit `.env` files; store secrets securely
6. **Resource Limits**: Service is limited to 1GB RAM and 200% CPU
7. **Nginx Security Headers**: Already configured in nginx.conf

## Performance Tuning

Adjust in `/etc/systemd/system/spellbee-aivoice.service`:
- `MemoryLimit` - Maximum RAM the service can use
- `CPUQuota` - CPU quota (200% = 2 cores)

Adjust in `/etc/nginx/sites-available/spellbee-aivoice`:
- `client_max_body_size` - Maximum upload size
- Worker processes and connections

## Support

For issues, check:
1. Service logs: `journalctl -u spellbee-aivoice -f`
2. Nginx logs: `/var/log/nginx/error.log`
3. Backend API: `curl http://localhost:8000/docs`
