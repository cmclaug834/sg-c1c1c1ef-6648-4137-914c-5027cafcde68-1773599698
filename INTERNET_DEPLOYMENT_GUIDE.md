# 🌍 Internet-Accessible Deployment Guide
## Rail Yard Tracking Sheet - Cloud & Cellular Setup

**Last Updated:** 2026-03-15  
**Version:** 2.0 - Internet-Accessible with JWT Authentication

---

## 📋 Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Options Comparison](#deployment-options-comparison)
4. [Option 1: Cloudflare Tunnel (Recommended for Testing)](#option-1-cloudflare-tunnel)
5. [Option 2: ngrok Tunnel](#option-2-ngrok-tunnel)
6. [Option 3: Vercel Cloud Hosting](#option-3-vercel-cloud-hosting)
7. [Option 4: Self-Hosted with Domain](#option-4-self-hosted-with-domain)
8. [Option 5: DigitalOcean/AWS Cloud Server](#option-5-digitalocean-aws-cloud-server)
9. [Security Configuration](#security-configuration)
10. [Mobile Device Setup](#mobile-device-setup)
11. [Cellular Network Testing](#cellular-network-testing)
12. [Monitoring & Maintenance](#monitoring-maintenance)
13. [Troubleshooting](#troubleshooting)
14. [Migration from LAN-Only Setup](#migration-from-lan-only-setup)

---

## 🚀 Quick Start (5 Minutes)

Get your tracking sheet accessible over the internet in under 5 minutes:

### **Prerequisites**
- ✅ Node.js 18+ installed
- ✅ Project running locally (`npm run dev` on port 3000)
- ✅ Terminal access

### **Fastest Path: Cloudflare Tunnel**

```bash
# Step 1: Install Cloudflare Tunnel
npm install -g cloudflared

# Step 2: Start your Next.js app (if not already running)
npm run dev

# Step 3: Start tunnel (in a new terminal window)
cloudflared tunnel --url http://localhost:3000

# Step 4: Copy the HTTPS URL from output
# Example: https://random-words-1234.trycloudflare.com
```

### **Configure the App**

1. Open your app: `http://localhost:3000`
2. Navigate to: **Settings → Network & Server**
3. Paste tunnel URL in **Server URL** field
4. Click **Save Configuration**
5. ✅ Done! Your app is now internet-accessible

### **Test on Mobile**

1. Click **"Show QR Code"** in Network Settings
2. Scan with mobile device (using cellular data)
3. App opens and works over cellular! 📱

---

## 🏗️ Architecture Overview

### **Before: LAN-Only Setup**

```
┌─────────────┐
│   Desktop   │
│  (Browser)  │──┐
└─────────────┘  │
                 │   WiFi Router
┌─────────────┐  │   (192.168.x.x)
│   Mobile    │──┤
│  (Browser)  │  │
└─────────────┘  │
                 │
┌─────────────┐  │
│   Server    │──┘
│ localhost:  │
│    3000     │
└─────────────┘

❌ Only works on same WiFi network
❌ Can't access from cellular
❌ Can't access from remote locations
```

### **After: Internet-Accessible Setup**

```
┌─────────────┐
│   Desktop   │ WiFi
│  (Browser)  │────┐
└─────────────┘    │
                   │
┌─────────────┐    │    ┌──────────────┐    ┌─────────────┐
│   Mobile    │ 4G │    │   Tunnel/    │    │   Server    │
│  (Browser)  │────┼───→│ Load Balancer│───→│ localhost:  │
└─────────────┘    │    │   (HTTPS)    │    │    3000     │
                   │    └──────────────┘    └─────────────┘
┌─────────────┐    │           ↑
│   Tablet    │ 5G │           │
│  (Browser)  │────┘           │ JWT Auth
└─────────────┘                │ Rate Limit
                               │ CORS
                               │ Encryption

✅ Works from anywhere in the world
✅ Cellular data support (4G/5G)
✅ Offline queue with auto-retry
✅ Secure JWT authentication
✅ HTTPS encryption
```

### **Key Components**

1. **Next.js Server** - Your existing app running on port 3000
2. **Tunnel/Proxy** - Cloudflare, ngrok, or reverse proxy (provides HTTPS)
3. **JWT Authentication** - Secure token-based auth for API requests
4. **Offline Queue** - Stores changes locally when connection drops
5. **Sync Engine** - Auto-syncs data when connection is restored
6. **Rate Limiter** - Protects server from abuse (100 req/15min per IP)

---

## 📊 Deployment Options Comparison

| Option | Cost | Setup Time | Best For | HTTPS | Reliability | Custom Domain |
|--------|------|------------|----------|-------|-------------|---------------|
| **Cloudflare Tunnel** | Free | 5 min | Testing, Development | ✅ Auto | ⭐⭐⭐⭐ | ✅ ($0-12/yr) |
| **ngrok** | Free-$10/mo | 5 min | Testing, Demos | ✅ Auto | ⭐⭐⭐⭐ | ✅ (Paid) |
| **Vercel** | Free-$20/mo | 10 min | Production | ✅ Auto | ⭐⭐⭐⭐⭐ | ✅ Free |
| **Self-Hosted** | $10-30/mo | 2-4 hours | Full Control | ⚙️ Manual | ⭐⭐⭐ | ✅ Required |
| **Cloud VPS** | $5-50/mo | 1-2 hours | Production | ⚙️ Manual | ⭐⭐⭐⭐⭐ | ✅ Extra cost |

### **Recommendation by Use Case**

- **Quick Testing (Today)**: Cloudflare Tunnel or ngrok
- **Production (Small Team <10)**: Vercel
- **Production (Large Team >10)**: Cloud VPS (DigitalOcean, AWS)
- **Maximum Control**: Self-Hosted with Domain
- **Temporary Demo**: ngrok with custom subdomain

---

## 🔵 Option 1: Cloudflare Tunnel

**Best for:** Testing, development, small teams (free forever)

### **Advantages**
- ✅ Completely free (no trial, no limits)
- ✅ Automatic HTTPS (no SSL certificate needed)
- ✅ Works behind any firewall/NAT
- ✅ No port forwarding required
- ✅ Built-in DDoS protection
- ✅ Global CDN (fast from anywhere)
- ✅ Can use custom domain (free)

### **Disadvantages**
- ❌ Random URL on restart (unless you configure named tunnel)
- ❌ Requires cloudflared process to be running
- ❌ Tunnel closes if process stops

---

### **Installation**

#### **macOS**
```bash
# Using Homebrew
brew install cloudflare/cloudflare/cloudflared

# Verify installation
cloudflared --version
```

#### **Windows**
```bash
# Using winget
winget install --id Cloudflare.cloudflared

# Or download installer from:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation
```

#### **Linux (Ubuntu/Debian)**
```bash
# Download and install
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Or using snap
sudo snap install cloudflared
```

#### **Cross-Platform (npm)**
```bash
# Works on all platforms
npm install -g cloudflared

# Note: This installs a wrapper, not the native binary
```

---

### **Quick Tunnel (Temporary URL)**

Perfect for testing - no account needed:

```bash
# Start your Next.js dev server
npm run dev

# In a new terminal, start tunnel
cloudflared tunnel --url http://localhost:3000
```

**Output:**
```
2024-03-15T18:34:29Z INFO  Your quick Tunnel has been created! 
Visit it at (it may take some time to be reachable):
https://random-words-1234.trycloudflare.com
```

**That's it!** Use that URL in your app's Network Settings.

**Limitations:**
- URL changes every restart
- No monitoring dashboard
- 24-hour session limit (auto-reconnects)

---

### **Named Tunnel (Permanent URL)**

For production use - keeps same URL forever:

#### **Step 1: Login to Cloudflare**

```bash
cloudflared tunnel login
```

This opens your browser to authenticate. You'll need:
- A Cloudflare account (free)
- A domain added to Cloudflare (can use free domain from Freenom or buy one)

#### **Step 2: Create Named Tunnel**

```bash
# Create tunnel (choose a name)
cloudflared tunnel create tracking-sheet

# Output shows tunnel ID and credentials file location
```

#### **Step 3: Configure DNS**

```bash
# Point your domain to the tunnel
cloudflared tunnel route dns tracking-sheet tracking.yourdomain.com

# Or use a subdomain
cloudflared tunnel route dns tracking-sheet rail.yourdomain.com
```

#### **Step 4: Create Configuration File**

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: tracking-sheet
credentials-file: /Users/you/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: tracking.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

#### **Step 5: Run the Tunnel**

```bash
# Start tunnel using config file
cloudflared tunnel run tracking-sheet

# Or run as a service (keeps running after reboot)
cloudflared service install
```

#### **Step 6: Configure Your App**

In Settings → Network & Server, use:
```
https://tracking.yourdomain.com
```

✅ This URL never changes, even after server restarts!

---

### **Run as Background Service**

#### **macOS/Linux (systemd)**

```bash
# Install service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f
```

#### **Windows (Service)**

```bash
# Install as Windows service
cloudflared service install

# Start service
sc start cloudflared

# Set to auto-start
sc config cloudflared start=auto
```

#### **Using PM2 (Cross-Platform)**

```bash
# Install PM2
npm install -g pm2

# Start tunnel with PM2
pm2 start cloudflared --name tunnel -- tunnel --url http://localhost:3000

# Save PM2 config
pm2 save

# Setup auto-start
pm2 startup
```

---

### **Monitoring & Logs**

```bash
# View real-time logs
cloudflared tunnel --loglevel debug --url http://localhost:3000

# Check tunnel status
cloudflared tunnel info tracking-sheet

# List all tunnels
cloudflared tunnel list
```

---

## 🟢 Option 2: ngrok Tunnel

**Best for:** Demos, presentations, temporary testing

### **Advantages**
- ✅ Web dashboard with request inspection
- ✅ Automatic HTTPS
- ✅ Reserved custom subdomains (paid)
- ✅ Easy traffic replay for debugging
- ✅ Webhook testing features

### **Disadvantages**
- ❌ Free tier has 40 connections/minute limit
- ❌ Random URLs on free tier
- ❌ Requires account for advanced features

---

### **Installation**

#### **Using npm**
```bash
npm install -g ngrok
```

#### **Manual Download**
Download from https://ngrok.com/download

#### **Homebrew (macOS)**
```bash
brew install ngrok
```

---

### **Quick Start (Free Tier)**

```bash
# Start tunnel
ngrok http 3000

# Output shows URLs:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

**Web Interface:** http://localhost:4040 (request inspector)

---

### **With Account (Custom Subdomain)**

```bash
# Sign up at ngrok.com and get auth token
ngrok authtoken YOUR_AUTH_TOKEN

# Reserve a custom subdomain (requires paid plan)
ngrok http 3000 --domain=your-tracking-app.ngrok.io

# This URL is permanent!
```

---

### **Advanced Configuration**

Create `ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN

tunnels:
  tracking-sheet:
    proto: http
    addr: 3000
    domain: your-tracking-app.ngrok.io
    inspect: true
    bind_tls: true
```

Start with config:
```bash
ngrok start tracking-sheet
```

---

### **Run as Service**

Using PM2:
```bash
pm2 start ngrok --name ngrok-tunnel -- http 3000 --domain=your-app.ngrok.io
pm2 save
pm2 startup
```

---

## ☁️ Option 3: Vercel Cloud Hosting

**Best for:** Production deployments, automatic scaling

### **Advantages**
- ✅ Free tier (hobby projects)
- ✅ Automatic HTTPS with custom domains
- ✅ Global CDN (edge network)
- ✅ Zero-config deployment
- ✅ Automatic CI/CD from Git
- ✅ 99.99% uptime SLA

### **Disadvantages**
- ❌ Serverless architecture (cold starts possible)
- ❌ Build time limits on free tier
- ❌ No persistent file storage (use database)

---

### **Deployment Steps**

#### **Method 1: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? tracking-sheet
# - Directory? ./
# - Override settings? No

# Output:
# ✅ Production: https://tracking-sheet.vercel.app
```

#### **Method 2: GitHub Integration**

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Click **Deploy**
5. ✅ Done! Auto-deploys on every push

---

### **Custom Domain Setup**

```bash
# Add domain via CLI
vercel domains add yourdomain.com

# Or use Vercel dashboard:
# Project Settings → Domains → Add Domain
```

Configure DNS (at your domain registrar):
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

---

### **Environment Variables**

```bash
# Set production secrets
vercel env add JWT_SECRET production
# Paste your secret key when prompted

# Or via dashboard:
# Project Settings → Environment Variables
```

Add to `.env.local`:
```bash
JWT_SECRET=your-super-secret-key-here
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

---

### **Production Optimization**

Update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compress responses
  compress: true,
  
  // Production headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 🏠 Option 4: Self-Hosted with Domain

**Best for:** Maximum control, on-premise requirements

### **Prerequisites**
- Domain name ($10-15/year)
- Static public IP or Dynamic DNS service
- Router with port forwarding capability
- Linux server (Ubuntu recommended)

---

### **Step 1: Server Setup**

#### **Install Node.js**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be 18+
npm --version
```

#### **Install Git**

```bash
sudo apt update
sudo apt install git
```

---

### **Step 2: Clone and Build Project**

```bash
# Clone your repository
git clone https://github.com/yourusername/tracking-sheet.git
cd tracking-sheet

# Install dependencies
npm install

# Build for production
npm run build

# Test production build
npm run start
```

Server should start on port 3000.

---

### **Step 3: SSL Certificate (Let's Encrypt)**

#### **Install Certbot**

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

#### **Obtain Certificate**

```bash
# Standalone mode (if no web server running)
sudo certbot certonly --standalone -d tracking.yourdomain.com

# Certificate files will be in:
# /etc/letsencrypt/live/tracking.yourdomain.com/
```

Certificates auto-renew. Test renewal:
```bash
sudo certbot renew --dry-run
```

---

### **Step 4: Reverse Proxy with Nginx**

#### **Install Nginx**

```bash
sudo apt install nginx
```

#### **Configure Nginx**

Create `/etc/nginx/sites-available/tracking-sheet`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name tracking.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name tracking.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/tracking.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tracking.yourdomain.com/privkey.pem;

    # SSL configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase upload size for photos
    client_max_body_size 20M;
}
```

#### **Enable Site**

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/tracking-sheet /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### **Step 5: Process Manager (PM2)**

Keep your app running 24/7:

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name tracking-sheet -- start

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup
# Run the command it outputs

# Monitor
pm2 monit

# View logs
pm2 logs tracking-sheet
```

---

### **Step 6: Router Configuration**

#### **Port Forwarding**

Login to your router and forward:
- Port 80 (HTTP) → Your server's local IP
- Port 443 (HTTPS) → Your server's local IP

#### **Dynamic DNS (if no static IP)**

Use services like:
- No-IP (free)
- DuckDNS (free)
- Cloudflare (free with domain)

Example with DuckDNS:
```bash
# Install DuckDNS updater
echo "url='https://www.duckdns.org/update?domains=yoursubdomain&token=YOUR_TOKEN&ip='" | curl -k -o ~/duckdns/duck.sh -K -

# Add to crontab
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

### **Step 7: Firewall Configuration**

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

---

### **Step 8: Configure Your App**

In Settings → Network & Server:
```
https://tracking.yourdomain.com
```

✅ Your self-hosted server is live!

---

## 🌐 Option 5: DigitalOcean/AWS Cloud Server

**Best for:** Production, scalability, managed infrastructure

### **DigitalOcean Deployment**

#### **Step 1: Create Droplet**

1. Go to https://digitalocean.com
2. Create Account (get $200 credit with GitHub Student Pack)
3. Create Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/month - 1GB RAM)
   - **Region:** Closest to your users
   - **Add SSH Key** (recommended)

#### **Step 2: Initial Server Setup**

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser deployer
usermod -aG sudo deployer

# Switch to new user
su - deployer
```

#### **Step 3: Install Dependencies**

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx

# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2
```

#### **Step 4: Deploy Application**

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/tracking-sheet.git
sudo chown -R deployer:deployer tracking-sheet
cd tracking-sheet

# Install and build
npm install
npm run build

# Start with PM2
pm2 start npm --name tracking-sheet -- start
pm2 save
pm2 startup
```

#### **Step 5: Domain & SSL**

Point your domain's A record to droplet IP:
```
Type: A
Name: @
Value: 123.45.67.89 (your droplet IP)
```

Get SSL certificate:
```bash
sudo certbot --nginx -d tracking.yourdomain.com
```

#### **Step 6: Nginx Configuration**

Certbot auto-configures Nginx. Verify:
```bash
sudo nano /etc/nginx/sites-enabled/default
```

Should include SSL config. Restart:
```bash
sudo systemctl restart nginx
```

---

### **AWS Lightsail (Simpler Alternative)**

AWS Lightsail is like DigitalOcean but on AWS:

1. Go to https://lightsail.aws.amazon.com
2. Create Instance:
   - **OS:** Ubuntu 22.04
   - **Plan:** $5/month (1GB RAM)
3. Follow same setup as DigitalOcean above

**Advantages over EC2:**
- Fixed pricing (no surprise bills)
- Simpler interface
- Includes free SSL certificates
- Automatic snapshots

---

## 🔒 Security Configuration

### **JWT Secret Management**

#### **Generate Strong Secret**

```bash
# Generate 256-bit random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: a1b2c3d4e5f6...
```

#### **Set Environment Variable**

Create `.env.local` (never commit this):
```bash
JWT_SECRET=your-generated-secret-here
NODE_ENV=production
```

#### **Vercel/Cloud Hosting**
Set via dashboard environment variables.

---

### **HTTPS Enforcement**

Already configured in:
- `src/lib/apiMiddleware.ts` - Forces HTTPS in production
- `next.config.mjs` - Security headers

Verify in browser:
- Lock icon in address bar
- Certificate valid
- HSTS header present

---

### **Rate Limiting Configuration**

Current settings (in `src/lib/apiMiddleware.ts`):
```typescript
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
};
```

**Adjust for your needs:**
- **High traffic:** Increase `max` to 200-500
- **Strict security:** Decrease to 50
- **API-heavy app:** Increase window to 60 minutes

---

### **CORS Configuration**

Already configured for internet access. Customize in `src/lib/apiMiddleware.ts`:

```typescript
// Allow specific domains only
const allowedOrigins = [
  'https://tracking.yourdomain.com',
  'https://mobile-app.yourdomain.com',
];

res.setHeader('Access-Control-Allow-Origin', 
  allowedOrigins.includes(origin) ? origin : 'null'
);
```

---

### **Password Security**

**Current implementation:** Basic bcrypt hashing (10 rounds)

**Recommendations:**
1. Enforce strong passwords (8+ chars, mixed case, numbers)
2. Add password strength meter
3. Implement account lockout after 5 failed attempts
4. Consider 2FA for admin accounts

---

### **Backup Strategy**

#### **Database Backups**

```bash
# Create backup directory
mkdir -p ~/backups

# Backup script (save as backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
APP_DIR=/var/www/tracking-sheet

# Backup localStorage data (if using file-based storage)
cp -r $APP_DIR/.data $BACKUP_DIR/data_$DATE

# Compress
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/data_$DATE
rm -rf $BACKUP_DIR/data_$DATE

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

Make executable and schedule:
```bash
chmod +x backup.sh

# Run daily at 2 AM
crontab -e
# Add: 0 2 * * * /home/deployer/backup.sh
```

---

## 📱 Mobile Device Setup

### **Option 1: QR Code (Recommended)**

1. On desktop, go to **Settings → Network & Server**
2. Click **"Show QR Code"**
3. QR code displays with server URL embedded
4. On mobile device:
   - Open camera app
   - Point at QR code
   - Tap notification to open link
5. ✅ App loads with correct server URL

---

### **Option 2: Manual URL Entry**

1. On mobile browser, visit your server URL directly:
   - Cloudflare: `https://random-words-1234.trycloudflare.com`
   - Custom domain: `https://tracking.yourdomain.com`
2. App loads automatically
3. Settings → Network & Server to verify connection

---

### **Option 3: Progressive Web App (PWA)**

Install as app on mobile device:

#### **iOS (Safari)**
1. Open app URL in Safari
2. Tap **Share** button
3. Tap **Add to Home Screen**
4. Enter name: "Rail Tracking"
5. Tap **Add**
6. ✅ App icon appears on home screen

#### **Android (Chrome)**
1. Open app URL in Chrome
2. Tap **⋮** menu (top right)
3. Tap **Add to Home screen**
4. Enter name: "Rail Tracking"
5. Tap **Add**
6. ✅ App icon appears on home screen

**Benefits:**
- Works offline
- Full-screen mode (no browser UI)
- Faster loading
- Push notifications (future feature)

---

## 📡 Cellular Network Testing

### **Test Scenarios**

#### **Test 1: WiFi Connection**
```
✅ Expected behavior:
- Connection type shows "WiFi"
- Sync happens immediately
- No data usage warnings
- Fast response times
```

#### **Test 2: 4G/5G Connection**
```
✅ Expected behavior:
- Connection type shows "Cellular"
- Sync works but may be slower
- Photos upload (may show progress)
- Network quality indicator visible
```

#### **Test 3: Poor Signal**
```
✅ Expected behavior:
- Connection type shows "Cellular (Poor)"
- Sync attempts with retry logic
- Offline queue builds up
- Auto-syncs when signal improves
```

#### **Test 4: Airplane Mode**
```
✅ Expected behavior:
- Connection type shows "Offline"
- All features work locally
- Changes saved to offline queue
- "Pending Changes: X" counter visible
```

#### **Test 5: Offline → Online Recovery**
```
✅ Expected behavior:
- Turn on airplane mode
- Create inspection, add data
- Turn off airplane mode
- Within 5 seconds: "Syncing..." appears
- Pending changes counter goes to 0
- Data appears on other devices
```

---

### **Monitoring Connection Quality**

**Built-in indicators** (visible in Settings → Network & Server):

1. **Connection Type Badge:**
   - 🟢 WiFi (Good)
   - 🟡 Cellular (Fair)
   - 🔴 Offline (No connection)

2. **Network Quality:**
   - Excellent (>10 Mbps)
   - Good (2-10 Mbps)
   - Fair (500kb-2Mbps)
   - Poor (<500kb)

3. **Last Sync Time:**
   - "Just now" = within 1 minute
   - "X minutes ago"
   - "X hours ago"
   - Red text if >1 hour

4. **Pending Changes:**
   - Shows count of queued items
   - Auto-clears when synced

---

### **Cellular Data Usage**

**Typical data usage:**
- Login: ~2 KB
- Sync (no changes): ~500 bytes
- Create inspection: ~5 KB
- Upload photo (compressed): ~200-500 KB
- Full day of use: ~10-20 MB

**Optimization tips:**
- App auto-compresses photos before upload
- Sync only happens when data changes
- Use WiFi for large photo uploads when possible
- Offline queue minimizes retries

---

## 📊 Monitoring & Maintenance

### **Health Checks**

#### **Built-in System Health Dashboard**

Access at: **Settings → System Health**

Monitors:
- ✅ Server connectivity
- ✅ API response times
- ✅ Storage usage
- ✅ Sync queue status
- ✅ Error rates
- ✅ Active users

---

### **Server Monitoring**

#### **Using PM2 (if self-hosted)**

```bash
# Real-time monitoring
pm2 monit

# Status overview
pm2 status

# View logs
pm2 logs tracking-sheet

# Restart if needed
pm2 restart tracking-sheet
```

#### **Uptime Monitoring (Free Services)**

Use external monitoring to get alerts:

**UptimeRobot (Free):**
1. Sign up at https://uptimerobot.com
2. Add monitor:
   - Type: HTTPS
   - URL: `https://yourdomain.com/api/ping`
   - Interval: 5 minutes
3. Get email/SMS alerts if down

**BetterUptime (Free):**
- More features
- Status page included
- Incident management

---

### **Log Management**

#### **Application Logs**

```bash
# View PM2 logs
pm2 logs tracking-sheet --lines 100

# Error logs only
pm2 logs tracking-sheet --err

# Follow logs in real-time
pm2 logs tracking-sheet -f
```

#### **Nginx Logs**

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Search for errors
sudo grep "error" /var/log/nginx/error.log
```

---

### **Performance Optimization**

#### **Enable Caching**

Add to `next.config.mjs`:

```javascript
const nextConfig = {
  // Enable SWC compilation cache
  experimental: {
    swcMinify: true,
  },
  
  // Cache static assets
  headers: async () => [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

#### **Database Indexing**

If using Supabase/PostgreSQL, add indexes:

```sql
-- Speed up inspection queries
CREATE INDEX idx_inspections_track ON inspections(track_id);
CREATE INDEX idx_inspections_date ON inspections(inspection_date);
CREATE INDEX idx_inspections_user ON inspections(inspector_id);
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **1. "Cannot connect to server"**

**Symptoms:**
- Connection type shows "Offline"
- Red banner: "Server unreachable"
- API calls fail

**Diagnosis:**
```bash
# Test server connectivity
curl https://yourdomain.com/api/ping

# Should return: {"status":"ok","timestamp":"..."}
```

**Solutions:**
- ✅ Verify tunnel/server is running
- ✅ Check firewall rules
- ✅ Verify DNS resolution: `nslookup yourdomain.com`
- ✅ Test from different network
- ✅ Check SSL certificate validity

---

#### **2. "401 Unauthorized" or "Token expired"**

**Symptoms:**
- Forced to login repeatedly
- API calls return 401 errors
- "Session expired" messages

**Diagnosis:**
```bash
# Check token in browser console
localStorage.getItem('auth_session')
```

**Solutions:**
- ✅ Login again (token may have expired)
- ✅ Check server clock (JWT uses timestamps)
- ✅ Verify JWT_SECRET matches on server
- ✅ Clear browser data and re-login

---

#### **3. "CORS policy blocked"**

**Symptoms:**
- Console errors: "CORS policy: No 'Access-Control-Allow-Origin'"
- API calls fail from browser
- Works in Postman but not browser

**Diagnosis:**
```bash
# Check CORS headers
curl -I https://yourdomain.com/api/ping

# Should include:
# Access-Control-Allow-Origin: *
```

**Solutions:**
- ✅ Verify `src/lib/apiMiddleware.ts` is applied to all routes
- ✅ Check Nginx/proxy config (may be stripping headers)
- ✅ Ensure server URL matches exactly (https vs http)

---

#### **4. Sync not working**

**Symptoms:**
- "Pending changes" counter stays >0
- Changes don't appear on other devices
- Offline queue not clearing

**Diagnosis:**
```bash
# Check sync logs in browser console (F12)
# Look for errors in Network tab

# Test sync endpoint manually
curl -X POST https://yourdomain.com/api/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"changes":[]}'
```

**Solutions:**
- ✅ Verify internet connection
- ✅ Check if rate limit exceeded (wait 15 min)
- ✅ Restart server: `pm2 restart tracking-sheet`
- ✅ Clear offline queue: Settings → Advanced → Clear Queue

---

#### **5. Slow performance on cellular**

**Symptoms:**
- Page loads take >10 seconds
- Photos timeout during upload
- Sync fails intermittently

**Diagnosis:**
Check network quality in Settings → Network & Server

**Solutions:**
- ✅ Use WiFi for photo uploads when possible
- ✅ Reduce photo quality: Settings → Camera → Quality: Medium
- ✅ Enable "Sync on WiFi only": Settings → Network → WiFi Only
- ✅ Check cellular signal strength

---

#### **6. "Download failed" for server installers**

**Symptoms:**
- 404 error when clicking download buttons
- "File not found" errors

**Solutions:**
- ✅ Verify files exist in `public/downloads/` directory
- ✅ Rebuild and restart: `npm run build && pm2 restart tracking-sheet`
- ✅ Check file permissions: `chmod 644 public/downloads/*`

---

#### **7. Tunnel disconnects randomly**

**Symptoms:**
- Cloudflare tunnel stops working
- Need to restart tunnel frequently
- URL becomes unreachable

**Solutions:**

**For Quick Tunnels:**
- ✅ Upgrade to named tunnel (permanent)
- ✅ Run tunnel as service
- ✅ Use PM2 to auto-restart

**For Named Tunnels:**
```bash
# Check tunnel status
cloudflared tunnel info tracking-sheet

# Restart tunnel
pm2 restart tunnel

# Check logs
pm2 logs tunnel
```

---

#### **8. SSL certificate errors**

**Symptoms:**
- "Your connection is not private"
- ERR_CERT_AUTHORITY_INVALID
- Certificate expired warnings

**Solutions:**

**Let's Encrypt (self-hosted):**
```bash
# Renew certificate
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal

# Check expiration
sudo certbot certificates
```

**Cloudflare/ngrok:**
- No action needed (auto-managed)

---

### **Getting Help**

#### **Debug Mode**

Enable verbose logging:

1. Open browser console (F12)
2. Run:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

3. All API calls and sync operations will log details

#### **Export Diagnostics**

Settings → System Health → **Export Diagnostics**

Creates JSON file with:
- Configuration state
- Recent errors
- Network status
- Storage usage
- Browser info

Share this file when reporting issues.

---

## 🔄 Migration from LAN-Only Setup

### **Data Preservation**

Good news: **All your existing data is preserved automatically!**

The new internet-accessible version:
- ✅ Uses same localStorage structure
- ✅ Backwards compatible with existing sessions
- ✅ Hybrid auth (works offline)
- ✅ Migrates data on first sync

### **Migration Steps**

#### **Step 1: Backup Current Data**

```bash
# Export from browser console
const data = {
  users: localStorage.getItem('railyard_users'),
  tracks: localStorage.getItem('railyard_tracks'),
  inspections: localStorage.getItem('railyard_inspections'),
  config: localStorage.getItem('railyard_backend_config'),
};

console.log(JSON.stringify(data, null, 2));
// Copy output to safe file
```

#### **Step 2: Update Codebase**

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart tracking-sheet
```

#### **Step 3: Configure Server URL**

1. Open app in browser
2. Settings → Network & Server
3. Enter your tunnel/domain URL
4. Click Save

#### **Step 4: Verify Data**

- Check that all tracks still appear
- Verify inspections are intact
- Test creating new inspection
- Confirm sync works

#### **Step 5: Update Mobile Devices**

- Send new server URL via QR code
- Or manually update in Settings
- Old local data merges with server

### **Rollback Plan**

If anything goes wrong:

```bash
# Restore previous version
git checkout <previous-commit>
npm install
npm run build
pm2 restart tracking-sheet

# Restore data from backup (browser console)
localStorage.setItem('railyard_users', backupData.users);
localStorage.setItem('railyard_tracks', backupData.tracks);
// ... etc
```

---

## 📝 Checklist: Pre-Production Launch

Before rolling out to your team:

### **Technical Readiness**
- [ ] Server deployed and accessible via HTTPS
- [ ] SSL certificate valid and auto-renewing
- [ ] DNS configured correctly
- [ ] Firewall rules tested
- [ ] Backups configured and tested
- [ ] Monitoring/alerts set up
- [ ] Rate limiting tested (try 100+ requests)
- [ ] Offline mode tested
- [ ] Sync tested between multiple devices

### **Security Readiness**
- [ ] Strong JWT secret configured
- [ ] Default admin password changed
- [ ] User accounts created for team
- [ ] HTTPS enforcement verified
- [ ] CORS configured appropriately
- [ ] Security headers tested
- [ ] Penetration testing completed (optional but recommended)

### **User Experience**
- [ ] Mobile devices tested on WiFi
- [ ] Mobile devices tested on cellular
- [ ] Offline → online recovery tested
- [ ] Photo uploads tested
- [ ] QR code setup tested
- [ ] User documentation prepared
- [ ] Training session scheduled

### **Operations**
- [ ] Support contact documented
- [ ] Escalation procedure defined
- [ ] Downtime notification plan
- [ ] Backup/restore procedure tested
- [ ] Update/deployment procedure documented

---

## 🎓 Training Your Team

### **Quick Start Guide for Inspectors**

**Print this and hand to field staff:**

```
═══════════════════════════════════════════════════════════
    RAIL YARD TRACKING SHEET - MOBILE SETUP GUIDE
═══════════════════════════════════════════════════════════

📱 SETUP (One-time, 2 minutes)

1. Scan QR code (provided by supervisor)
   - OR -
   Visit: https://tracking.yourdomain.com

2. Tap "Add to Home Screen" in your browser menu

3. Login with your username & password

✅ Done! App works everywhere (WiFi or Cellular)

═══════════════════════════════════════════════════════════

📡 CONNECTION TYPES

🟢 WiFi = Best (fast, no data charges)
🟡 Cellular = Works fine (uses ~20MB/day)
🔴 Offline = All features work, syncs later

═══════════════════════════════════════════════════════════

🚂 DAILY USAGE

1. Open app from home screen
2. Tap "New Inspection"
3. Fill in details as normal
4. Take photos (app compresses automatically)
5. Sign when complete

Changes save automatically every few seconds!

═══════════════════════════════════════════════════════════

❓ TROUBLESHOOTING

Problem: "Can't connect"
→ Check if you have WiFi/cellular signal
→ App works offline, will sync when signal returns

Problem: "Token expired"
→ Just login again (Settings → Login)

Problem: Photos won't upload
→ Use WiFi if possible, or wait until better signal

═══════════════════════════════════════════════════════════

📞 SUPPORT

Office: (555) 123-4567
Email: support@yourdomain.com

═══════════════════════════════════════════════════════════
```

---

## 📚 Additional Resources

### **Official Documentation**
- Next.js: https://nextjs.org/docs
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- ngrok: https://ngrok.com/docs
- Vercel: https://vercel.com/docs
- Let's Encrypt: https://letsencrypt.org/getting-started/

### **Community Support**
- Next.js Discord: https://discord.gg/nextjs
- Stack Overflow: Tag `next.js` for questions

### **Security Best Practices**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://datatracker.ietf.org/doc/html/rfc8725
- SSL Labs Test: https://www.ssllabs.com/ssltest/

---

## 🎉 Summary

You now have:
- ✅ Internet-accessible tracking sheet
- ✅ Cellular network support
- ✅ Secure JWT authentication
- ✅ Offline queue with auto-retry
- ✅ Multiple deployment options
- ✅ Production-ready security
- ✅ Comprehensive monitoring
- ✅ Migration path from LAN-only

**Recommended Path:**
1. Test with Cloudflare Tunnel (free, 5 min setup)
2. Validate with team on cellular
3. Deploy to Vercel or self-hosted (production)
4. Monitor and scale as needed

**Questions?** Review the troubleshooting section or check the logs!

---

**Document Version:** 2.0  
**Last Updated:** 2026-03-15  
**Maintained by:** Your Dev Team