# MrToxic Discord Bot

A comprehensive, enterprise-level Discord moderation and server management bot built with Discord.js v14.

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- A Discord Bot Token from [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. **Clone/Download** this project
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Discord bot token and other configuration values

4. **Run the bot:**
   ```bash
   npm start
   ```

## 📋 Environment Setup

### Required Variables
- `TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your bot's client ID

### Optional Variables
- `GUILD_ID`: Test server ID (for development)
- `AUTO_ROLE_ID`: Role to auto-assign to new members
- `VERIFY_ROLE_ID`: Verification role
- `WELCOME_CHANNEL_ID`: Welcome messages channel
- `LOGGING_CHANNEL_ID`: Moderation logs channel

## 🎯 Features Overview

### ⚖️ Advanced Moderation
- **Warnings System**: Multi-level warning system with automatic escalation
- **Timeout Management**: Flexible user timeouts with duration parsing
- **Ban/Kick System**: Comprehensive member removal with logging
- **Message Management**: Bulk delete with advanced filtering
- **Channel Controls**: Slowmode, lockdown, and permission management

### 🛠️ Server Utilities
- **Interactive Polls**: Real-time voting with multiple options
- **Giveaway System**: Complete giveaway management with entry tracking
- **Reminder System**: Personal and public reminders
- **Server Analytics**: Detailed statistics and activity monitoring
- **User Profiles**: Comprehensive member information display

### 🤖 Automation Systems
- **Anti-Spam Protection**: Real-time spam detection and prevention
- **Welcome System**: Member onboarding and farewell messages
- **Auto-Role Assignment**: Automatic role distribution for new members
- **Verification System**: Timed verification with auto-kick
- **Activity Monitoring**: Server health and engagement tracking

### 🔧 Administration Tools
- **Bot Configuration**: Easy setup through `/setup` commands
- **Server Backups**: Complete server structure backup system
- **Management Dashboard**: Advanced server analytics and health monitoring
- **Audit Logging**: Comprehensive action tracking and reporting

## 📁 Project Structure

```
T1/
├── commands/           # All bot commands organized by category
│   ├── admin/         # Administrative commands
│   ├── moderation/    # Moderation commands
│   ├── utility/       # General utility commands
│   └── embedSender/   # Embed creation commands
├── events/            # Discord event handlers
├── systems/           # Background automation systems
├── utils/             # Shared utilities and helpers
├── data/              # Configuration and data storage
├── logs/              # Bot operation logs
├── backups/           # Server backup files
├── index.js           # Main bot entry point
├── package.json       # Project dependencies
└── .env.example       # Environment configuration template
```

## 🎮 Commands List

### Moderation Commands
- `/ban` - Ban users with customizable options
- `/kick` - Remove users from server
- `/mute` - Timeout users for specified duration
- `/unban` - Remove user bans
- `/warn` - Issue warnings to users
- `/warnings` - View and manage user warnings
- `/purge` - Bulk delete messages with filters
- `/slowmode` - Set channel rate limiting
- `/lockdown` - Emergency channel/server lockdown
- `/role` - Comprehensive role management

### Utility Commands
- `/ping` - Check bot latency and status
- `/help` - Interactive command help system
- `/say` - Send messages through the bot
- `/serverinfo` - Display server information
- `/userinfo` - Show detailed user profiles
- `/stats` - Advanced server analytics
- `/poll` - Create interactive polls
- `/giveaway` - Manage giveaways
- `/remind` - Set personal reminders
- `/embed` - Create custom embed messages

### Admin Commands
- `/setup` - Configure bot features
- `/backup` - Create server backups
- `/manage` - Advanced server management tools

## 🔄 Background Systems

### Anti-Spam System
Automatically detects and prevents:
- Message frequency spam
- Duplicate message spam
- Excessive caps lock usage
- Mention bombing
- Automatic escalation with timeouts

### Welcome System
- Customizable welcome messages
- Member milestone celebrations
- Goodbye notifications
- DM onboarding messages

### Auto-Role System
- Automatic role assignment for new members
- Permission validation
- Role hierarchy management

### Verification System
- Timed verification requirements
- Auto-kick for unverified users
- Graceful cleanup and logging

## 🛠️ Configuration

Use `/setup` commands to configure bot features:
- `/setup autorole` - Configure automatic role assignment
- `/setup verification` - Setup verification system
- `/setup welcome` - Configure welcome/goodbye messages
- `/setup logging` - Setup moderation logging
- `/setup view` - View current configuration

## 📊 Logging

The bot maintains comprehensive logs in the `logs/` directory:
- Daily rotation with timestamps
- Color-coded console output for development
- Separate error logging
- Command usage auditing
- System activity tracking

## 🔒 Security Features

- Permission validation for all commands
- Role hierarchy respect
- Rate limit handling
- Input sanitization
- Comprehensive error handling
- Audit trail maintenance

## 🚀 Deployment

### Local Hosting
```bash
npm install
npm start
```

### Cloud Hosting (Heroku, Railway, etc.)
1. Set environment variables in your hosting platform
2. Deploy the entire T1 folder
3. Ensure Node.js 16+ runtime
4. Use `npm start` as the start command

### VPS Hosting
1. Install Node.js 16+
2. Transfer files to server
3. Install dependencies: `npm install`
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "mrtoxic-bot"
   pm2 save
   pm2 startup
   ```

## 📝 Bot Permissions Required

Ensure your bot has these permissions in Discord:
- Send Messages
- Embed Links
- Use Slash Commands
- Manage Messages
- Manage Roles
- Kick Members
- Ban Members
- Manage Channels
- Read Message History
- Add Reactions

## 🆘 Support & Troubleshooting

### Common Issues

1. **Commands not appearing:**
   - Ensure bot has `applications.commands` scope
   - Check environment variables are set correctly
   - Restart the bot

2. **Permission errors:**
   - Verify bot role is high enough in hierarchy
   - Check channel permissions
   - Ensure required permissions are granted

3. **Bot not responding:**
   - Check bot token validity
   - Verify internet connection
   - Check console logs for errors

### Getting Help
- Check the logs in `logs/` directory
- Review configuration with `/setup view`
- Ensure all required environment variables are set
- Verify Discord permissions are correct

## 📜 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Made with ❤️ for Discord server management**