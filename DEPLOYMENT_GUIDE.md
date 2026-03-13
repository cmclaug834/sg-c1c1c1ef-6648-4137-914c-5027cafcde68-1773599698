# Rail Yard Tracker - Deployment Guide

Complete guide for deploying Rail Yard Tracker on desktop computers and servers.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Desktop Deployment (Windows)](#desktop-deployment-windows)
3. [Desktop Deployment (macOS)](#desktop-deployment-macos)
4. [Desktop Deployment (Linux)](#desktop-deployment-linux)
5. [Server Deployment](#server-deployment)
6. [Network Configuration](#network-configuration)
7. [Security Setup](#security-setup)
8. [Backup & Recovery](#backup--recovery)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- Storage: 10 GB free space
- OS: Windows 10+, macOS 10.15+, Ubuntu 20.04+

**Recommended:**
- CPU: Quad-core 2.5 GHz+
- RAM: 8 GB+
- Storage: 50 GB free space (for media files)
- OS: Windows 11, macOS 12+, Ubuntu 22.04+

### Software Requirements

```bash
# Node.js 18 or higher
node --version  # Should show v18.0.0 or higher

# npm (comes with Node.js)
npm --version   # Should show 9.0.0 or higher

# Git (optional, for version control)
git --version
```

### Download Node.js

**Windows/macOS:**
- Visit: https://nodejs.org/
- Download LTS version
- Run installer
- Accept defaults

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

---

## Desktop Deployment (Windows)

### Step 1: Extract Files

```powershell
# Extract ZIP file to desired location
# Recommended: C:\RailYard\App\

# Open PowerShell or Command Prompt
cd C:\RailYard\App
```

### Step 2: Install Dependencies

```powershell
npm install
```

This will take 2-5 minutes depending on your internet speed.

### Step 3: Run Quick Setup

```powershell
# Start the app in development mode first
npm run dev

# Open browser
start http://localhost:3000

# Navigate to Settings → Backend & System Settings
# Click "Start Quick Setup" wizard
# Wait for automated configuration
```

### Step 4: Build for Production

```powershell
# Stop development server (Ctrl+C)

# Build production version
npm run build

# This creates optimized production build
```

### Step 5: Start Production Server

```powershell
# Start server
npm start

# Server will run on http://localhost:3000
```

### Step 6: Configure Windows Firewall

```powershell
# Open Windows Firewall
# Allow Node.js through firewall for local network access

# Or use PowerShell (Run as Administrator):
New-NetFirewallRule -DisplayName "Rail Yard Tracker" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 7: Install as Windows Service (Optional)

```powershell
# Install PM2 globally
npm install -g pm2
npm install -g pm2-windows-service

# Setup PM2 service
pm2-service-install

# Start app with PM2
pm2 start npm --name "rail-yard-tracker" -- start
pm2 save

# App will now start automatically on Windows boot
```

### Step 8: Find Local IP Address

```powershell
# Get your local IP
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100

# Test access from another device:
# http://192.168.1.100:3000
```

---

## Desktop Deployment (macOS)

### Step 1: Extract Files

```bash
# Extract ZIP file to desired location
# Recommended: /Users/Shared/RailYard/

# Open Terminal
cd /Users/Shared/RailYard
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Quick Setup

```bash
# Start the app
npm run dev

# Open browser
open http://localhost:3000

# Navigate to Settings → Backend & System Settings
# Click "Start Quick Setup" wizard
```

### Step 4: Build for Production

```bash
# Build production version
npm run build
```

### Step 5: Start Production Server

```bash
# Start server
npm start
```

### Step 6: Configure macOS Firewall

```bash
# System Settings → Network → Firewall
# Add Node.js to allowed apps

# Or disable firewall for local network:
# (Only if on trusted network)
```

### Step 7: Install as Launch Agent (Auto-start)

```bash
# Install PM2
npm install -g pm2

# Start app with PM2
pm2 start npm --name "rail-yard-tracker" -- start
pm2 save

# Generate startup script
pm2 startup

# Copy the command output and run it
# Example: sudo env PATH=$PATH:...
```

### Step 8: Find Local IP Address

```bash
# Get your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: 192.168.1.100

# Test access: http://192.168.1.100:3000
```

---

## Desktop Deployment (Linux)

### Step 1: Extract Files

```bash
# Extract to /opt directory
sudo mkdir -p /opt/railyard
sudo unzip rail-yard-tracker-v2.0.0.zip -d /opt/railyard

# Change ownership
sudo chown -R $USER:$USER /opt/railyard

cd /opt/railyard
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build for Production

```bash
npm run build
```

### Step 4: Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/railyard.service
```

Add this content:

```ini
[Unit]
Description=Rail Yard Tracker
After=network.target

[Service]
Type=simple
User=railyard
WorkingDirectory=/opt/railyard
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=railyard

Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Step 5: Enable and Start Service

```bash
# Create user for service
sudo useradd -r -s /bin/false railyard
sudo chown -R railyard:railyard /opt/railyard

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable railyard

# Start service
sudo systemctl start railyard

# Check status
sudo systemctl status railyard
```

### Step 6: Configure Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw reload

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### Step 7: Find Local IP Address

```bash
# Get local IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# Or
hostname -I

# Test access: http://192.168.1.XXX:3000
```

---

## Server Deployment

### Cloud Providers

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Your app will be at: https://your-app.vercel.app
```

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# Link to project
railway link
```

#### DigitalOcean

```bash
# Create Droplet (Ubuntu 22.04)
# SSH into server
ssh root@your-droplet-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone or upload your project
cd /opt
git clone https://github.com/your-repo/rail-yard-tracker.git

# Follow Linux deployment steps above
```

### Docker Deployment

```dockerfile
# Create Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t rail-yard-tracker .

# Run container
docker run -d -p 3000:3000 --name railyard rail-yard-tracker

# Or use Docker Compose
docker-compose up -d
```

---

## Network Configuration

### Find Your Server IP

**Windows:**
```powershell
ipconfig
# Look for IPv4 Address: 192.168.1.XXX
```

**macOS/Linux:**
```bash
ifconfig  # or: ip addr show
# Look for inet: 192.168.1.XXX
```

### Configure Router (Port Forwarding)

If you need external access:

```
1. Login to router admin (usually 192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server"
3. Add rule:
   - External Port: 3000
   - Internal Port: 3000
   - Internal IP: 192.168.1.XXX (your server IP)
   - Protocol: TCP
4. Save and apply
```

### DNS Setup (Optional)

```
1. Register domain (e.g., railyard.company.com)
2. Point A record to your public IP
3. Configure reverse proxy (nginx/apache)
4. Setup SSL certificate (Let's Encrypt)
```

### Mobile Device Configuration

```
1. Connect mobile to same WiFi
2. Open browser on mobile
3. Navigate to: http://192.168.1.XXX:3000
4. Bookmark for easy access
```

---

## Security Setup

### Change Default Admin Password

```
1. Login as admin (default: admin/admin123)
2. Go to Settings → User Management
3. Click on admin user
4. Change password
5. Save
```

### Create User Accounts

```
Settings → Network & Server → User Management

For each user:
1. Click "Add User"
2. Enter username (e.g., john.doe)
3. Enter display name (e.g., John Doe)
4. Select role (Admin/Inspector/Viewer)
5. Set strong password
6. Save
```

### Enable HTTPS (Production)

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d railyard.company.com

# Update Next.js config to use HTTPS
# Or use reverse proxy (nginx/Apache)
```

### Firewall Rules

**Allow only local network:**
```bash
# Windows
New-NetFirewallRule -DisplayName "RailYard Local" -Direction Inbound -LocalAddress 192.168.1.0/24 -LocalPort 3000 -Protocol TCP -Action Allow

# Linux (UFW)
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Linux (iptables)
iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 3000 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

### Session Security

Sessions expire after 24 hours automatically.
Configure in `src/lib/auth.ts` if needed:

```typescript
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
```

---

## Backup & Recovery

### Automated Backup Setup

```
Settings → Backend & System Settings

1. Enable backups
2. Set backup location (e.g., C:\RailYard\Backups)
3. Set frequency (daily/weekly/monthly)
4. Set retention (number of backups to keep)
5. Save
```

### Manual Backup

```bash
# Windows
xcopy C:\RailYard\Data D:\Backups\RailYard\%DATE% /E /I

# macOS/Linux
cp -r /Users/Shared/RailYard/Data /Backups/RailYard/$(date +%Y%m%d)

# Or use tar
tar -czf railyard-backup-$(date +%Y%m%d).tar.gz /opt/railyard/data
```

### Backup to Cloud

```bash
# Upload to cloud storage
# AWS S3
aws s3 sync /opt/railyard/data s3://your-bucket/railyard-backup/

# Google Drive (rclone)
rclone sync /opt/railyard/data gdrive:RailYard/Backups

# Dropbox
rclone sync /opt/railyard/data dropbox:RailYard/Backups
```

### Restore from Backup

```bash
# Stop the service
pm2 stop rail-yard-tracker

# Restore data
cp -r /Backups/RailYard/20260313/* /opt/railyard/data/

# Start service
pm2 start rail-yard-tracker

# Verify data
# Login and check inspections/tracks
```

---

## Monitoring & Maintenance

### System Health Checks

```
Settings → System Health & Stability

Run health check:
1. Click "Run Health Check"
2. Wait for all tests to complete
3. Review results
4. Fix any warnings/errors
5. Export report for records
```

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs rail-yard-tracker

# View resource usage
pm2 monit

# Restart if needed
pm2 restart rail-yard-tracker
```

### Disk Space Monitoring

```bash
# Check disk usage
df -h

# Check Rail Yard data size
du -sh /opt/railyard/data

# Clean old backups if needed
find /opt/railyard/backups -name "*.tar.gz" -mtime +30 -delete
```

### Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Update Process

```bash
# Backup first!
tar -czf railyard-backup-before-update.tar.gz /opt/railyard

# Pull new version
git pull origin main

# Install new dependencies
npm install

# Build
npm run build

# Restart
pm2 restart rail-yard-tracker

# Run health check
# Settings → System Health & Stability
```

### Performance Optimization

```
Settings → Backend & System Settings

1. Enable compression
2. Adjust cache size (100 MB recommended)
3. Set image quality (80-85% for balance)
4. Set video resolution (720p or 1080p)
5. Save
```

### Database Maintenance

```bash
# Clear old sessions (in app)
Settings → System Health & Stability → Maintenance

# Or manually
npm run maintenance:cleanup
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# macOS/Linux
lsof -i :3000
kill -9 <process_id>

# Or use different port
PORT=3001 npm start
```

### Service Won't Start

```bash
# Check logs
pm2 logs rail-yard-tracker

# Or systemd logs
sudo journalctl -u railyard -f

# Check file permissions
ls -la /opt/railyard

# Fix permissions
sudo chown -R railyard:railyard /opt/railyard
```

### Mobile Can't Connect

```
1. Verify server is running
   - pm2 status
   - Should show "online"

2. Check firewall
   - Windows: Allow Node.js through firewall
   - Linux: sudo ufw status

3. Verify IP address
   - ipconfig (Windows)
   - ifconfig (macOS/Linux)

4. Test from mobile browser
   - http://SERVER-IP:3000
   - Should see login page

5. Check same WiFi network
   - Both devices on same network
```

### High Memory Usage

```bash
# Check memory
pm2 monit

# If high (>1GB):
# 1. Check for memory leaks in logs
# 2. Restart service
pm2 restart rail-yard-tracker

# 3. Adjust cache size
# Settings → Backend & Performance → Cache Size
```

### Sync Not Working

```
1. Run health check
   Settings → System Health & Stability

2. Check sync configuration
   Settings → Network & Server

3. Verify network connection
   Test Connection button

4. Check server logs
   pm2 logs rail-yard-tracker

5. Manual sync
   Settings → Network & Server → Sync Now
```

---

## Production Checklist

Before going live:

```
☐ Change default admin password
☐ Create user accounts for all inspectors
☐ Run health check (all tests pass)
☐ Configure automated backups
☐ Test multi-device sync
☐ Configure firewall rules
☐ Test from mobile devices
☐ Document server IP address
☐ Share QR code with users
☐ Train users on app usage
☐ Setup monitoring (PM2/logs)
☐ Test backup restore process
☐ Document emergency procedures
```

---

## Support

For deployment assistance:
- Email: support@softgen.ai
- Documentation: See PROJECT_EXPORT.md
- Health Check: Settings → System Health & Stability

---

**Deployment Guide Version:** 2.0.0  
**Last Updated:** March 13, 2026