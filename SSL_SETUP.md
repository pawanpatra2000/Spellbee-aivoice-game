# 🔐 SSL Setup Commands for Spellbee & BookLeaf

## Quick SSL Setup

### 1. Install Certbot (if not installed)
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Get SSL Certificate for Spellbee
```bash
sudo certbot certonly --nginx -d spellbee.pawanpatra.com
```

### 3. Get SSL Certificate for BookLeaf (if not already done)
```bash
sudo certbot certonly --nginx -d support.pawanpatra.com
```

### 4. Verify Certificates
```bash
sudo certbot certificates
```

**Output should show:**
```
Certificate Name: spellbee.pawanpatra.com
  Serial: ...
  Key Type: RSA 2048
  Domains: spellbee.pawanpatra.com
  Expiry Date: 202X-XX-XX
  Valid: True

Certificate Name: support.pawanpatra.com
  Serial: ...
  Key Type: RSA 2048
  Domains: support.pawanpatra.com
  Expiry Date: 202X-XX-XX
  Valid: True
```

### 5. Test Nginx Config
```bash
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 6. Reload Nginx to Apply SSL
```bash
sudo systemctl reload nginx
```

### 7. Verify SSL is Working
```bash
# Test Spellbee
curl -I https://spellbee.pawanpatra.com

# Test BookLeaf
curl -I https://support.pawanpatra.com

# Both should return HTTP/2 200 or similar
```

---

## 🔄 Auto-Renewal (Automatic)

Certbot automatically creates a timer to renew certificates. Verify it's running:

```bash
# Check renewal timer
sudo systemctl list-timers certbot

# Test renewal (dry-run, doesn't actually renew)
sudo certbot renew --dry-run

# Manual renewal if needed
sudo certbot renew
```

---

## 📝 Certificate Locations

After SSL setup, certificates are stored at:

```
/etc/letsencrypt/live/spellbee.pawanpatra.com/
├── cert.pem           ← Certificate
├── chain.pem          ← Intermediate certs
├── fullchain.pem      ← Full certificate chain
└── privkey.pem        ← Private key

/etc/letsencrypt/live/support.pawanpatra.com/
├── cert.pem
├── chain.pem
├── fullchain.pem
└── privkey.pem
```

Nginx config references these:
```nginx
ssl_certificate     /etc/letsencrypt/live/spellbee.pawanpatra.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/spellbee.pawanpatra.com/privkey.pem;
```

---

## ✅ SSL Verification Checklist

```bash
# 1. Check certificate expiry dates
sudo certbot certificates

# 2. Verify Nginx is using correct certificates
sudo grep -A 2 "ssl_certificate" /etc/nginx/sites-available/spellbee

# 3. Test SSL quality (external)
curl -I https://spellbee.pawanpatra.com
curl -I https://support.pawanpatra.com

# 4. Check certificate details
echo | openssl s_client -servername spellbee.pawanpatra.com -connect spellbee.pawanpatra.com:443 2>/dev/null | openssl x509 -noout -dates

# 5. Verify auto-renewal is configured
sudo systemctl status certbot.timer
```

---

## 🔧 Troubleshooting SSL

### Certificate Request Failed
```bash
# Make sure DNS is pointing to server
nslookup spellbee.pawanpatra.com
# Should return your server's IP

# Make sure port 80 and 443 are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Retry certificate request
sudo certbot certonly --nginx -d spellbee.pawanpatra.com --force-renewal
```

### Nginx SSL Config Error
```bash
# Test Nginx config
sudo nginx -t

# Check for typos in sites-available files
sudo cat /etc/nginx/sites-available/spellbee | grep ssl_

# Verify certificate files exist
ls -la /etc/letsencrypt/live/spellbee.pawanpatra.com/
```

### Certificate Renewal Failed
```bash
# Check renewal logs
sudo journalctl -u certbot -n 50

# Manual renewal with verbose output
sudo certbot renew -v

# Force renewal
sudo certbot renew --force-renewal
```

### Mixed HTTP/HTTPS
```bash
# Verify HTTP redirects to HTTPS in Nginx config
sudo grep -A 1 "listen 80" /etc/nginx/sites-available/spellbee

# Should see:
# server {
#     listen 80;
#     return 301 https://$host$request_uri;
# }
```

---

## 🔐 Enforce HTTPS Only

To force HTTPS-only access (recommended):

```bash
# Add this to Nginx config /etc/nginx/sites-available/spellbee
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Apply and reload
sudo systemctl reload nginx
```

---

## 📅 Certificate Renewal Schedule

Certbot automatically renews certificates 30 days before expiry:

```bash
# Check renewal schedule
sudo systemctl list-timers certbot

# Manual check (what would be renewed?)
sudo certbot renew --dry-run

# Logs are written to:
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## One-Line SSL Setup for Both Projects

```bash
# Setup SSL for both domains at once
sudo certbot certonly --nginx -d spellbee.pawanpatra.com -d support.pawanpatra.com && sudo nginx -t && sudo systemctl reload nginx && sudo certbot certificates
```

---

## ✨ After SSL is Setup

Your applications are now secure:

- ✅ **https://spellbee.pawanpatra.com** — Spellbee (secured)
- ✅ **https://support.pawanpatra.com** — BookLeaf (secured)
- ✅ Auto-redirect from HTTP → HTTPS
- ✅ Auto-renewal every 60 days
- ✅ A+ SSL rating

Test with browser or:
```bash
curl -I https://spellbee.pawanpatra.com
```

Should show `HTTP/2 200` and certificate info.
