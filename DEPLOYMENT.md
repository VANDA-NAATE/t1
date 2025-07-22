# MrToxic Discord Bot - Deployment Guide

## 🚀 Deployment Options

### 1. Local Hosting (Development/Testing)

**Requirements:**
- Node.js 16.0.0 or higher
- Stable internet connection
- Discord Bot Token

**Steps:**
```bash
# 1. Extract the T1 folder to your desired location
cd T1

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your bot token and settings

# 4. Run the bot
npm start
```

**Pros:**
- Full control over the environment
- Easy debugging and development
- No hosting costs

**Cons:**
- Requires your computer to stay online
- No automatic restarts
- Limited scalability

---

### 2. VPS Hosting (Recommended for Production)

#### Popular VPS Providers:
- **DigitalOcean** ($5-10/month)
- **Linode** ($5-10/month)
- **Vultr** ($3.5-6/month)
- **AWS EC2** (Variable pricing)

#### Setup Steps:

**1. Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Git (if needed)
sudo apt install git
```

**2. Deploy Bot:**
```bash
# Upload T1 folder to server or clone from repository
cd /path/to/T1

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit with your settings

# Start with PM2
pm2 start index.js --name "mrtoxic-bot"
pm2 save
pm2 startup  # Follow the instructions
```

**3. Process Management:**
```bash
# View bot status
pm2 status

# View logs
pm2 logs mrtoxic-bot

# Restart bot
pm2 restart mrtoxic-bot

# Stop bot
pm2 stop mrtoxic-bot

# Monitor performance
pm2 monit
```

---

### 3. Cloud Platform Hosting

#### Railway (Easiest)

**Steps:**
1. Create account at [Railway.app](https://railway.app/)
2. Create new project from GitHub/upload
3. Connect your T1 folder as repository
4. Add environment variables in Railway dashboard:
   - `TOKEN`: Your bot token
   - `CLIENT_ID`: Your client ID
5. Deploy automatically

**Configuration:**
- Runtime: Node.js
- Build command: `npm install`
- Start command: `npm start`

#### Heroku

**Steps:**
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-bot-name`
4. Set environment variables:
   ```bash
   heroku config:set TOKEN=your_bot_token
   heroku config:set CLIENT_ID=your_client_id
   ```
5. Deploy: `git push heroku main`

**Required Files:**
- `Procfile`: `worker: node index.js`

#### Render

**Steps:**
1. Create account at [Render.com](https://render.com/)
2. Create new Web Service from repository
3. Configure:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables in dashboard

---

### 4. Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

USER node

CMD ["npm", "start"]
```

**Docker Commands:**
```bash
# Build image
docker build -t mrtoxic-bot .

# Run container
docker run -d \
  --name mrtoxic-bot \
  --env-file .env \
  --restart unless-stopped \
  mrtoxic-bot

# View logs
docker logs mrtoxic-bot

# Stop container
docker stop mrtoxic-bot
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Discord Configuration
TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id

# Optional: Development
GUILD_ID=your_test_server_id

# Optional: Feature Configuration
AUTO_ROLE_ID=role_id_for_new_members
VERIFY_ROLE_ID=verification_role_id
VERIFY_TIMEOUT_MINUTES=10
WELCOME_CHANNEL_ID=welcome_channel_id
GOODBYE_CHANNEL_ID=goodbye_channel_id
LOGGING_CHANNEL_ID=moderation_logs_channel_id
```

### Platform-Specific Setup

#### Railway Environment Variables
```
TOKEN = your_bot_token
CLIENT_ID = your_client_id
```

#### Heroku Environment Variables
```bash
heroku config:set TOKEN=your_bot_token
heroku config:set CLIENT_ID=your_client_id
# Add others as needed
```

#### Docker Environment Variables
```bash
# Using .env file
docker run --env-file .env mrtoxic-bot

# Using individual variables
docker run -e TOKEN=your_token -e CLIENT_ID=your_id mrtoxic-bot
```

---

## 🔒 Security Best Practices

### Token Security
- **Never commit tokens to version control**
- Use environment variables for sensitive data
- Rotate tokens if compromised
- Use different tokens for development/production

### Server Security (VPS)
```bash
# Create non-root user
sudo adduser botuser
sudo usermod -aG sudo botuser

# Setup firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 443
sudo ufw allow 80

# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh
```

### Application Security
- Keep dependencies updated: `npm audit fix`
- Use HTTPS for webhooks (if implemented)
- Validate all user inputs
- Implement rate limiting
- Monitor for suspicious activity

---

## 📊 Monitoring & Logging

### PM2 Monitoring
```bash
# Install PM2 monitoring (optional paid service)
pm2 install pm2-server-monit

# View detailed metrics
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate
```

### Log Management
```bash
# View recent logs
pm2 logs --lines 200

# View specific app logs
pm2 logs mrtoxic-bot

# Clear logs
pm2 flush

# Save logs to file
pm2 logs > bot_logs.txt
```

### Health Monitoring
Create `health-check.js`:
```javascript
const { Client } = require('discord.js');

async function healthCheck() {
    const client = new Client({ intents: [] });
    
    try {
        await client.login(process.env.TOKEN);
        console.log('✅ Bot is healthy');
        process.exit(0);
    } catch (error) {
        console.log('❌ Bot health check failed:', error.message);
        process.exit(1);
    }
}

healthCheck();
```

---

## 🔄 Updates & Maintenance

### Update Process
```bash
# 1. Backup current version
cp -r T1 T1-backup-$(date +%Y%m%d)

# 2. Download new version
# Replace files with updated versions

# 3. Install new dependencies
npm install

# 4. Restart bot
pm2 restart mrtoxic-bot

# 5. Monitor for issues
pm2 logs mrtoxic-bot
```

### Database Backup
```bash
# Create data backup
cp -r data data-backup-$(date +%Y%m%d)

# Backup logs
cp -r logs logs-backup-$(date +%Y%m%d)
```

### Automated Backups (Linux)
```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/path/to/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup bot data
cp -r /path/to/T1/data $BACKUP_DIR/data-$DATE
cp -r /path/to/T1/logs $BACKUP_DIR/logs-$DATE

# Compress backups older than 7 days
find $BACKUP_DIR -name "data-*" -type d -mtime +7 -exec tar -czf {}.tar.gz {} \; -exec rm -rf {} \;
find $BACKUP_DIR -name "logs-*" -type d -mtime +7 -exec tar -czf {}.tar.gz {} \; -exec rm -rf {} \;

# Remove compressed backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x backup.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## 🚨 Troubleshooting Common Issues

### Bot Won't Start
```bash
# Check Node.js version
node --version  # Should be 16.0.0+

# Check dependencies
npm install

# Check environment variables
cat .env

# Check logs
pm2 logs mrtoxic-bot
```

### Commands Not Updating
```bash
# Clear Discord command cache
# Remove GUILD_ID from .env for global commands
# Restart bot
pm2 restart mrtoxic-bot

# Check command registration logs
pm2 logs mrtoxic-bot | grep "command"
```

### Memory Issues
```bash
# Monitor memory usage
pm2 monit

# Increase memory limit (if needed)
pm2 delete mrtoxic-bot
pm2 start index.js --name "mrtoxic-bot" --max-memory-restart 500M
```

### Performance Issues
```bash
# Check system resources
htop

# Check disk space
df -h

# Check bot performance
pm2 monit

# Optimize PM2 settings
pm2 delete mrtoxic-bot
pm2 start index.js --name "mrtoxic-bot" --instances 1 --max-memory-restart 500M
```

---

## 📞 Support Resources

### Getting Help
1. Check logs first: `pm2 logs mrtoxic-bot`
2. Review Discord.js documentation
3. Check Discord API status
4. Verify environment configuration
5. Test with minimal configuration

### Useful Commands
```bash
# System information
node --version
npm --version
pm2 --version

# Bot diagnostics
pm2 describe mrtoxic-bot
pm2 monit

# Resource monitoring
htop
df -h
free -h
```

### Emergency Recovery
```bash
# If bot is completely broken:
pm2 stop mrtoxic-bot
pm2 delete mrtoxic-bot

# Restore from backup
cp -r T1-backup-YYYYMMDD/* T1/

# Restart fresh
cd T1
npm install
pm2 start index.js --name "mrtoxic-bot"
```

---

**🎯 Choose the deployment method that best fits your needs:**
- **Development/Testing**: Local hosting
- **Small servers**: Cloud platforms (Railway, Heroku)
- **Large servers**: VPS hosting with PM2
- **Enterprise**: Docker with orchestration

**📝 Remember to:**
- Keep your bot token secure
- Monitor logs regularly
- Update dependencies periodically
- Backup configurations and data
- Test updates in development first