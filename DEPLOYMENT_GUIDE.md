# Library Management System - VPS Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Library Management System to a Virtual Private Server (VPS). This deployment method gives you full control over your hosting environment and is ideal for production use.

## Prerequisites

### VPS Requirements
- **Operating System**: Ubuntu 20.04 LTS or newer (recommended)
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Public IP address with SSH access

### Local Requirements
- SSH client (Terminal on macOS/Linux, PuTTY on Windows)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

## Environment Configuration

### Environment Variables for Production

Create environment files for different deployment stages:

#### Production Environment Variables
\`\`\`env
# Production API URL
NEXT_PUBLIC_LIBRARY_API_URL=https://api.yourdomain.com

# Application Configuration
NEXT_PUBLIC_APP_NAME=Library Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Production Settings
NODE_ENV=production
\`\`\`

## VPS Server Setup

### 1. Initial Server Configuration

#### Connect to Your VPS
\`\`\`bash
# Connect via SSH
ssh root@your-server-ip
# or if using a non-root user
ssh username@your-server-ip
\`\`\`

#### Update System Packages
\`\`\`bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common
\`\`\`

#### Create Application User
\`\`\`bash
# Create a dedicated user for the application
sudo adduser --system --group --home /var/www/library-app library-app

# Add user to sudo group (if needed)
sudo usermod -aG sudo library-app
\`\`\`

### 2. Install Node.js

#### Install Node.js 18+ using NodeSource Repository
\`\`\`bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
\`\`\`

#### Alternative: Install using NVM (Node Version Manager)
\`\`\`bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload bash profile
source ~/.bashrc

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
\`\`\`

### 3. Install Process Manager (PM2)

\`\`\`bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
\`\`\`

### 4. Install and Configure Nginx

\`\`\`bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx
\`\`\`

### 5. Install SSL Certificate (Let's Encrypt)

\`\`\`bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
\`\`\`

## Application Deployment

### 1. Clone and Setup Application

\`\`\`bash
# Switch to application user
sudo su - library-app

# Navigate to application directory
cd /var/www/library-app

# Clone the repository
git clone https://github.com/your-username/library-pwa.git .

# Install dependencies
npm install --legacy-peer-deps
\`\`\`

### 2. Environment Configuration

\`\`\`bash
# Create production environment file
nano .env.production

# Add your production environment variables
NEXT_PUBLIC_LIBRARY_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Library Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
\`\`\`

### 3. Build Application

\`\`\`bash
# Build the application for production
npm run build

# Test the build locally
npm start
\`\`\`

### 4. Configure PM2

#### Create PM2 Ecosystem File
\`\`\`bash
# Create ecosystem configuration
nano ecosystem.config.js
\`\`\`

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'library-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/library-app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_LIBRARY_API_URL: 'https://api.yourdomain.com',
      NEXT_PUBLIC_APP_NAME: 'Library Management System',
      NEXT_PUBLIC_APP_VERSION: '1.0.0'
    },
    error_file: '/var/log/pm2/library-app-error.log',
    out_file: '/var/log/pm2/library-app-out.log',
    log_file: '/var/log/pm2/library-app.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
\`\`\`

#### Start Application with PM2
\`\`\`bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown library-app:library-app /var/log/pm2

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
pm2 logs library-app
\`\`\`

## Nginx Configuration

### 1. Create Nginx Configuration

\`\`\`bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/library-app
\`\`\`

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Main Application
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
        proxy_read_timeout 86400;
    }

    # Static Files Caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # PWA Files
    location /manifest.json {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }

    location /favicon.ico {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }

    # API Routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error Pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
\`\`\`

### 2. Enable Nginx Configuration

\`\`\`bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/library-app /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
\`\`\`

## Firewall Configuration

### Configure UFW (Uncomplicated Firewall)

\`\`\`bash
# Enable UFW
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
\`\`\`

## Database and External Services

### API Configuration

Ensure your external API is accessible:

\`\`\`bash
# Test API connectivity
curl -I https://api.yourdomain.com/web/jsonapi/lmsbook/lmsbook

# Check DNS resolution
nslookup api.yourdomain.com
\`\`\`

## Monitoring and Logging

### 1. Setup Log Rotation

\`\`\`bash
# Install logrotate configuration for PM2
sudo nano /etc/logrotate.d/pm2
\`\`\`

\`\`\`
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 library-app library-app
    postrotate
        pm2 reloadLogs
    endscript
}
\`\`\`

### 2. System Monitoring

\`\`\`bash
# Install htop for system monitoring
sudo apt install -y htop

# Monitor system resources
htop

# Monitor application logs
pm2 logs library-app

# Monitor Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
\`\`\`

### 3. Application Health Monitoring

\`\`\`bash
# Check application status
pm2 status

# Monitor application performance
pm2 monit

# Restart application if needed
pm2 restart library-app

# Reload application (zero-downtime)
pm2 reload library-app
\`\`\`

## Backup and Recovery

### 1. Automated Backup Script

\`\`\`bash
# Create backup script
sudo nano /usr/local/bin/backup-library-app.sh
\`\`\`

\`\`\`bash
#!/bin/bash

# Configuration
APP_DIR="/var/www/library-app"
BACKUP_DIR="/var/backups/library-app"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Backup environment files
cp $APP_DIR/.env.production $BACKUP_DIR/env_$DATE

# Backup Nginx configuration
cp /etc/nginx/sites-available/library-app $BACKUP_DIR/nginx_$DATE

# Backup PM2 configuration
cp $APP_DIR/ecosystem.config.js $BACKUP_DIR/pm2_$DATE

# Clean old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_*" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "nginx_*" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "pm2_*" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
\`\`\`

\`\`\`bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-library-app.sh

# Test backup script
sudo /usr/local/bin/backup-library-app.sh
\`\`\`

### 2. Schedule Automated Backups

\`\`\`bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-library-app.sh >> /var/log/backup.log 2>&1
\`\`\`

### 3. Recovery Procedure

\`\`\`bash
# Stop application
pm2 stop library-app

# Restore from backup
cd /var/www
sudo tar -xzf /var/backups/library-app/app_YYYYMMDD_HHMMSS.tar.gz -C library-app

# Restore environment
sudo cp /var/backups/library-app/env_YYYYMMDD /var/www/library-app/.env.production

# Restore configurations
sudo cp /var/backups/library-app/nginx_YYYYMMDD /etc/nginx/sites-available/library-app
sudo cp /var/backups/library-app/pm2_YYYYMMDD /var/www/library-app/ecosystem.config.js

# Rebuild and restart
cd /var/www/library-app
npm install --legacy-peer-deps
npm run build
pm2 start ecosystem.config.js --env production
sudo systemctl reload nginx
\`\`\`

## Deployment Automation

### 1. Deployment Script

\`\`\`bash
# Create deployment script
nano /var/www/library-app/deploy.sh
\`\`\`

\`\`\`bash
#!/bin/bash

# Configuration
APP_DIR="/var/www/library-app"
BRANCH="main"

echo "Starting deployment..."

# Navigate to app directory
cd $APP_DIR

# Backup current version
cp .env.production .env.production.backup

# Pull latest changes
git fetch origin
git reset --hard origin/$BRANCH

# Install dependencies
npm install --legacy-peer-deps

# Build application
npm run build

# Restore environment
cp .env.production.backup .env.production

# Restart application
pm2 reload library-app

# Check application status
sleep 5
pm2 status library-app

echo "Deployment completed!"
\`\`\`

\`\`\`bash
# Make script executable
chmod +x deploy.sh
\`\`\`

### 2. Zero-Downtime Deployment

\`\`\`bash
# Create zero-downtime deployment script
nano /var/www/library-app/deploy-zero-downtime.sh
\`\`\`

\`\`\`bash
#!/bin/bash

APP_DIR="/var/www/library-app"
TEMP_DIR="/tmp/library-app-deploy"
BRANCH="main"

echo "Starting zero-downtime deployment..."

# Create temporary directory
rm -rf $TEMP_DIR
git clone https://github.com/your-username/library-pwa.git $TEMP_DIR
cd $TEMP_DIR
git checkout $BRANCH

# Install dependencies and build
npm install --legacy-peer-deps
npm run build

# Copy environment file
cp $APP_DIR/.env.production $TEMP_DIR/

# Stop old application
pm2 stop library-app

# Replace application files
rsync -av --delete $TEMP_DIR/ $APP_DIR/

# Start new application
cd $APP_DIR
pm2 start ecosystem.config.js --env production

# Cleanup
rm -rf $TEMP_DIR

echo "Zero-downtime deployment completed!"
\`\`\`

## Security Hardening

### 1. SSH Security

\`\`\`bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# Port 2222 (change from default 22)
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

# Restart SSH service
sudo systemctl restart ssh
\`\`\`

### 2. Fail2Ban Installation

\`\`\`bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local
\`\`\`

\`\`\`ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
\`\`\`

\`\`\`bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
\`\`\`

### 3. System Updates

\`\`\`bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
\`\`\`

## Performance Optimization

### 1. System Optimization

\`\`\`bash
# Optimize system limits
sudo nano /etc/security/limits.conf

# Add these lines:
library-app soft nofile 65536
library-app hard nofile 65536
\`\`\`

### 2. Node.js Optimization

\`\`\`bash
# Update PM2 configuration for better performance
nano ecosystem.config.js
\`\`\`

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'library-app',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // ... other env vars
    }
  }]
}
\`\`\`

### 3. Nginx Optimization

\`\`\`bash
# Optimize Nginx configuration
sudo nano /etc/nginx/nginx.conf
\`\`\`

\`\`\`nginx
worker_processes auto;
worker_connections 1024;

http {
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    
    # Enable caching
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
\`\`\`

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
\`\`\`bash
# Check PM2 logs
pm2 logs library-app

# Check system resources
htop
df -h

# Restart application
pm2 restart library-app
\`\`\`

#### 2. SSL Certificate Issues
\`\`\`bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
\`\`\`

#### 3. High Memory Usage
\`\`\`bash
# Monitor memory usage
pm2 monit

# Restart application to clear memory
pm2 restart library-app

# Check for memory leaks
pm2 logs library-app --lines 100
\`\`\`

#### 4. Database Connection Issues
\`\`\`bash
# Test API connectivity
curl -I https://api.yourdomain.com

# Check DNS resolution
nslookup api.yourdomain.com

# Test from application server
wget -O- https://api.yourdomain.com/web/jsonapi/lmsbook/lmsbook
\`\`\`

## Maintenance Procedures

### Daily Tasks
- Monitor application logs: `pm2 logs library-app`
- Check system resources: `htop`
- Verify SSL certificate status
- Review backup logs

### Weekly Tasks
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review security logs: `sudo journalctl -u fail2ban`
- Check disk space: `df -h`
- Test backup restoration procedure

### Monthly Tasks
- Security audit and updates
- Performance review and optimization
- SSL certificate renewal check
- Review and update documentation

## Support and Maintenance

### Log Locations
- **Application Logs**: `/var/log/pm2/library-app.log`
- **Nginx Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **System Logs**: `/var/log/syslog`
- **Backup Logs**: `/var/log/backup.log`

### Useful Commands
\`\`\`bash
# Application management
pm2 status
pm2 restart library-app
pm2 logs library-app

# System monitoring
htop
df -h
free -m

# Service management
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl status fail2ban

# Log monitoring
tail -f /var/log/pm2/library-app.log
tail -f /var/log/nginx/access.log
\`\`\`


---

This VPS deployment guide provides comprehensive instructions for deploying, securing, and maintaining your Library Management System on a Virtual Private Server. Follow these steps carefully and maintain regular backups to ensure a stable production environment.
