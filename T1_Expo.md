# MrToxic Discord Bot - Complete Documentation & Structure Guide

## 📖 Table of Contents
1. [Bot Overview & Capabilities](#bot-overview--capabilities)
2. [Project Structure Explained](#project-structure-explained)
3. [Command Reference Guide](#command-reference-guide)
4. [Background Systems Documentation](#background-systems-documentation)
5. [Setup & Configuration Guide](#setup--configuration-guide)
6. [File Structure & Purpose](#file-structure--purpose)
7. [Advanced Features & Automation](#advanced-features--automation)
8. [Troubleshooting & Maintenance](#troubleshooting--maintenance)

---

## 🤖 Bot Overview & Capabilities

MrToxic is a comprehensive Discord server management bot designed for professional Discord communities. It combines advanced moderation tools, interactive utilities, automated systems, and detailed analytics into one powerful solution.

### 🎯 Core Purposes
- **Server Moderation**: Complete toolkit for managing members and content
- **Community Engagement**: Interactive features like polls, giveaways, and welcome systems
- **Automation**: Background systems that handle routine tasks automatically
- **Analytics**: Detailed insights into server health and activity
- **Administration**: Advanced tools for server setup and management

### 🌟 Key Strengths
- **24 Slash Commands** across multiple categories
- **5 Background Systems** running automated tasks
- **Real-time Monitoring** with health scores and activity tracking
- **Comprehensive Logging** for all actions and events
- **Easy Configuration** through interactive setup commands
- **Scalable Architecture** supporting multiple servers efficiently

---

## 📁 Project Structure Explained

```
T1/ (Root Directory)
├── 📄 index.js              # Main bot launcher and command loader
├── 📄 package.json          # Project dependencies and metadata
├── 📄 .env.example         # Environment variables template
├── 📄 README.md            # Basic setup and usage guide
├── 📄 T1_Expo.md          # This comprehensive documentation
│
├── 🗂️ commands/             # All bot commands organized by category
│   ├── 🗂️ admin/           # Server administration commands
│   │   ├── backup.js       # Server backup and restore system
│   │   ├── lockdown.js     # Emergency server lockdown
│   │   ├── manage.js       # Advanced management dashboard
│   │   ├── role.js         # Comprehensive role management
│   │   └── setup.js        # Bot configuration system
│   │
│   ├── 🗂️ moderation/      # Member and content moderation
│   │   ├── ban.js          # Ban system with options
│   │   ├── kick.js         # Member removal
│   │   ├── mute.js         # Timeout management
│   │   ├── purge.js        # Bulk message deletion
│   │   ├── slowmode.js     # Channel rate limiting
│   │   ├── unban.js        # Ban removal system
│   │   ├── warn.js         # Warning system
│   │   └── warnings.js     # Warning history management
│   │
│   ├── 🗂️ utility/         # General purpose utilities
│   │   ├── giveaway.js     # Complete giveaway system
│   │   ├── help.js         # Interactive help system
│   │   ├── ping.js         # Latency testing
│   │   ├── poll.js         # Interactive polling system
│   │   ├── remind.js       # Reminder system
│   │   ├── say.js          # Message repeater
│   │   ├── serverinfo.js   # Server information display
│   │   ├── stats.js        # Advanced analytics
│   │   └── userinfo.js     # User profile system
│   │
│   └── 🗂️ embedSender/     # Rich message creation
│       └── embed.js        # Custom embed creator
│
├── 🗂️ events/              # Discord event handlers
│   ├── interactionCreate.js # Slash command processor
│   └── ready.js            # Bot startup handler
│
├── 🗂️ systems/             # Background automation systems
│   ├── antiSpam.js         # Real-time spam prevention
│   ├── autoRole.js         # Automatic role assignment
│   ├── messageCleaner.js   # Automated message cleanup
│   ├── verifyKick.js       # Verification enforcement
│   └── welcomeSystem.js    # Member onboarding
│
├── 🗂️ utils/               # Shared utilities and helpers
│   └── logger.js           # Logging system
│
├── 🗂️ data/                # Configuration and persistent data
│   └── (guild configurations stored here)
│
├── 🗂️ logs/                # Bot operation logs
│   └── (daily log files created automatically)
│
└── 🗂️ backups/             # Server backup storage
    └── (backup files created by /backup command)
```

---

## 🎮 Command Reference Guide

### 🔨 Moderation Commands

#### `/ban`
**Purpose**: Permanently ban users from the server
**Parameters**:
- `user` (required): User to ban
- `reason` (optional): Reason for the ban
- `delete_days` (optional): Days of message history to delete (0-7)

**Features**:
- Comprehensive permission checking
- DM notification to banned user
- Detailed logging with timestamps
- Message history cleanup options
- Appeal information in DM

#### `/kick`
**Purpose**: Remove users from the server
**Parameters**:
- `user` (required): User to kick
- `reason` (optional): Reason for removal

**Features**:
- Permission validation
- DM notification with reason
- Audit logging
- Graceful error handling

#### `/mute`
**Purpose**: Timeout users for specified duration
**Parameters**:
- `user` (required): User to timeout
- `duration` (required): Duration (5m, 1h, 2d format)
- `reason` (optional): Reason for timeout

**Features**:
- Flexible duration parsing (minutes, hours, days)
- Automatic timeout removal
- Progress tracking
- Comprehensive logging

#### `/warn`
**Purpose**: Issue warnings to users with escalation system
**Parameters**:
- `user` (required): User to warn
- `reason` (required): Warning reason

**Features**:
- Automatic escalation (3 warnings = timeout, 5 = ban)
- Warning history tracking
- DM notifications
- Configurable thresholds

#### `/warnings`
**Purpose**: View and manage user warning history
**Subcommands**:
- `view`: Display user's warnings
- `clear`: Remove all warnings
- `remove`: Remove specific warning

#### `/purge`
**Purpose**: Advanced bulk message deletion
**Parameters**:
- `amount` (required): Number of messages (1-100)
- `user` (optional): Filter by user
- `contains` (optional): Filter by text content
- `bots_only` (optional): Delete only bot messages
- `embeds_only` (optional): Delete only embed messages
- `attachments_only` (optional): Delete only messages with files

**Features**:
- Multiple filtering options
- Handles Discord's 14-day limitation
- Detailed deletion reports
- Safe bulk operations

#### `/slowmode`
**Purpose**: Set channel rate limiting
**Parameters**:
- `seconds` (required): Delay between messages (0 to disable)
- `channel` (optional): Target channel
- `reason` (optional): Reason for slowmode

#### `/lockdown`
**Purpose**: Emergency server/channel lockdown
**Parameters**:
- `action` (required): lock/unlock
- `target` (optional): channel/server
- `reason` (optional): Lockdown reason

**Features**:
- Role-based exception system
- Emergency override capabilities
- Detailed lockdown logging

#### `/role`
**Purpose**: Comprehensive role management
**Subcommands**:
- `add`: Assign role to user
- `remove`: Remove role from user
- `create`: Create new role
- `delete`: Delete role
- `edit`: Modify existing role
- `info`: Display role information

### 🔧 Utility Commands

#### `/poll`
**Purpose**: Create interactive polls with real-time voting
**Parameters**:
- `question` (required): Poll question
- `option1`, `option2` (required): First two options
- `option3`, `option4`, `option5` (optional): Additional options
- `duration` (optional): Poll duration in minutes

**Features**:
- Real-time vote tracking
- Visual progress bars
- Automatic poll closure
- Results preservation

#### `/giveaway`
**Purpose**: Complete giveaway management system
**Subcommands**:
- `start`: Create new giveaway
- `end`: End giveaway early

**Start Parameters**:
- `prize` (required): Giveaway prize
- `duration` (required): Duration in minutes
- `winners` (optional): Number of winners
- `requirements` (optional): Entry requirements

**Features**:
- Button-based entry system
- Duplicate entry prevention
- Random winner selection
- Entry tracking and statistics

#### `/remind`
**Purpose**: Personal and public reminder system
**Parameters**:
- `time` (required): When to remind (5m, 1h, 2d format)
- `message` (required): Reminder content
- `user` (optional): User to remind
- `private` (optional): Send privately

**Features**:
- Flexible time parsing
- Public and private reminders
- Automatic cleanup
- Fallback to channel if DM fails

#### `/stats`
**Purpose**: Advanced server analytics and metrics
**Parameters**:
- `period` (optional): today/week/month/all

**Features**:
- Member activity analysis
- Channel usage statistics
- Growth tracking
- Role distribution analysis
- Server health metrics

#### `/userinfo`
**Purpose**: Comprehensive user profile display
**Parameters**:
- `user` (optional): Target user (defaults to self)

**Features**:
- Account creation date
- Server join date
- Role hierarchy display
- Permission analysis
- Activity status

#### `/serverinfo`
**Purpose**: Detailed server information display

**Features**:
- Member statistics
- Channel breakdown
- Server features
- Boost information
- Creation date and ownership

#### `/ping`
**Purpose**: Bot latency and status testing

**Features**:
- WebSocket latency
- API response time
- Status indicators
- Health monitoring

#### `/help`
**Purpose**: Interactive command help system

**Features**:
- Category-based navigation
- Dropdown menu interface
- Detailed command descriptions
- Usage examples

#### `/say`
**Purpose**: Send messages through the bot
**Parameters**:
- `message` (required): Message content

**Features**:
- Content filtering
- Mention protection
- Logging of usage

#### `/embed`
**Purpose**: Create custom rich embed messages
**Parameters**:
- `title` (required): Embed title
- `description` (optional): Embed description
- `color` (optional): Embed color
- `footer` (optional): Footer text
- `image` (optional): Image URL
- `thumbnail` (optional): Thumbnail URL

### 🛡️ Admin Commands

#### `/setup`
**Purpose**: Comprehensive bot configuration system
**Subcommands**:
- `autorole`: Configure automatic role assignment
- `verification`: Setup verification system
- `welcome`: Configure welcome/goodbye messages
- `logging`: Setup moderation logging
- `view`: Display current configuration

**Features**:
- Interactive configuration
- Validation and testing
- Permission checking
- Configuration persistence

#### `/backup`
**Purpose**: Complete server backup system
**Subcommands**:
- `create`: Create server backup
- `list`: View available backups

**Features**:
- Role structure backup
- Channel configuration backup
- Server settings backup
- Downloadable backup files

#### `/manage`
**Purpose**: Advanced server management dashboard
**Subcommands**:
- `overview`: Server management overview
- `activity`: Activity and health metrics
- `roles`: Role management operations
- `channels`: Channel management tools

**Features**:
- Health score calculation
- Activity level analysis
- Management recommendations
- Inactive resource identification

---

## 🤖 Background Systems Documentation

### 🛡️ Anti-Spam System (`antiSpam.js`)
**Purpose**: Real-time spam detection and prevention

**Detection Methods**:
- **Message Frequency**: Monitors messages per time window
- **Duplicate Content**: Detects repeated messages
- **Caps Lock Spam**: Identifies excessive capitalization
- **Mention Bombing**: Prevents mass mentioning

**Actions Taken**:
1. Warning (first violation)
2. Timeout (escalating duration)
3. Automatic cleanup of spam messages
4. DM notifications to users

**Configuration**:
- Spam threshold: 5 messages in 5 seconds
- Duplicate threshold: 3 identical messages
- Warning threshold: 3 warnings before timeout
- Caps threshold: 70% caps in messages over 20 characters

### 👋 Welcome System (`welcomeSystem.js`)
**Purpose**: Comprehensive member onboarding and farewell

**Features**:
- **Welcome Messages**: Rich embeds with server information
- **Goodbye Notifications**: Member departure tracking
- **Milestone Celebrations**: Automated celebrations at member milestones
- **DM Onboarding**: Private welcome messages with server guide
- **Member Count Tracking**: Real-time member statistics

**Customization Options**:
- Welcome/goodbye channels (via `/setup welcome`)
- Message templates with server information
- Milestone thresholds (10, 25, 50, 100, 250, 500, 1000+)

### 🎭 Auto Role System (`autoRole.js`)
**Purpose**: Automatic role assignment for new members

**Features**:
- Immediate role assignment upon joining
- Permission validation
- Role hierarchy respect
- Error handling and logging
- Configuration via `/setup autorole`

### ✅ Verification System (`verifyKick.js`)
**Purpose**: Timed verification enforcement

**Features**:
- Configurable timeout period
- Automatic kick for unverified users
- Grace period management
- Verification role tracking
- Cleanup and logging

### 🧹 Message Cleaner (`messageCleaner.js`)
**Purpose**: Automated message cleanup via `/clean` command

**Features**:
- Age-based deletion
- Date range filtering
- Count-based cleanup
- Permission validation
- Bulk operation safety

---

## ⚙️ Setup & Configuration Guide

### 🚀 Initial Setup

1. **Download the T1 folder** to your local machine
2. **Install Node.js** 16.0.0 or higher
3. **Open terminal** in the T1 directory
4. **Install dependencies**:
   ```bash
   npm install
   ```

### 🔑 Discord Bot Creation

1. **Visit** [Discord Developer Portal](https://discord.com/developers/applications)
2. **Create New Application** and give it a name
3. **Go to Bot section** and create a bot
4. **Copy the Bot Token** (keep this secret!)
5. **Copy the Application ID** (Client ID)
6. **Enable all Privileged Gateway Intents**:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent

### 🌐 Bot Permissions Setup

**Required Permissions** (use permission calculator: 1342565456):
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
- Manage Nicknames
- Manage Guild

**Invite URL Format**:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1342565456&scope=bot%20applications.commands
```

### 📝 Environment Configuration

1. **Copy** `.env.example` to `.env`
2. **Fill in** your values:
   ```env
   TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_test_server_id (optional, for testing)
   ```

### ▶️ Running the Bot

**Development** (with logs):
```bash
npm start
```

**Production** (with PM2):
```bash
npm install -g pm2
pm2 start index.js --name mrtoxic-bot
pm2 save
pm2 startup
```

### 🎛️ In-Discord Configuration

After inviting the bot to your server:

1. **Use `/setup view`** to see current configuration
2. **Configure Auto-Role**: `/setup autorole @role`
3. **Setup Welcome**: `/setup welcome #channel`
4. **Configure Logging**: `/setup logging #mod-logs`
5. **Test with**: `/ping` and `/help`

---

## 📄 File Structure & Purpose

### 🏗️ Core Files

#### `index.js`
**Purpose**: Main bot entry point and command loader
**Key Functions**:
- Discord client initialization
- Dynamic command loading from subdirectories
- Event handler registration
- Background system initialization
- Graceful shutdown handling

**Important Features**:
- Modular architecture for easy expansion
- Automatic command discovery
- Error handling and logging
- Intent management

#### `package.json`
**Purpose**: Project configuration and dependencies
**Key Contents**:
- Node.js dependencies (discord.js, dotenv)
- Scripts for running the bot
- Project metadata
- Engine requirements

### 🎯 Command Files Structure

All command files follow this structure:
```javascript
module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Description'),
    
    async execute(interaction) {
        // Command logic here
    }
};
```

**Key Components**:
- **data**: Discord.js SlashCommandBuilder instance
- **execute**: Async function handling command execution
- **Permissions**: Default member permissions where needed
- **Options**: Parameters the command accepts

### 🔧 Utility Files

#### `utils/logger.js`
**Purpose**: Centralized logging system
**Features**:
- File-based logging with rotation
- Color-coded console output
- Multiple log levels (INFO, WARN, ERROR, DEBUG)
- Timestamp formatting
- Error stack trace capture

### 📊 Data Management

#### `data/` Directory
**Purpose**: Persistent configuration storage
**Contents**:
- Guild-specific configurations
- Warning databases
- Custom settings
- Backup metadata

#### `logs/` Directory
**Purpose**: Operation logs
**Contents**:
- Daily log files (YYYY-MM-DD.log)
- Error logs
- Command usage logs
- System activity logs

#### `backups/` Directory
**Purpose**: Server backup storage
**Contents**:
- JSON backup files
- Server structure exports
- Role and channel configurations

---

## 🚀 Advanced Features & Automation

### 🧠 Intelligent Spam Detection

The anti-spam system uses multiple algorithms:

**Pattern Recognition**:
- Message frequency analysis
- Content similarity detection
- User behavior profiling
- Escalation pattern matching

**Response Mechanisms**:
- Graduated penalties
- Automatic message cleanup
- User education through DMs
- Appeal process information

### 📈 Analytics & Monitoring

**Server Health Scoring**:
```
Health Score = (Active Members / Total Members) * 100
- 90-100: Excellent
- 70-89: Good
- 50-69: Average
- 30-49: Poor
- 0-29: Critical
```

**Activity Levels**:
- Very Active (30%+ online)
- Active (20-29% online)
- Moderate (10-19% online)
- Low (5-9% online)
- Very Low (<5% online)

### 🔄 Automation Triggers

**Welcome System Triggers**:
- Member join → Welcome message + DM
- Member leave → Goodbye notification
- Milestone reached → Celebration message
- Role assignment → Auto-role application

**Moderation Triggers**:
- Spam detected → Warning/timeout
- Warning threshold → Escalation
- Verification timeout → Auto-kick
- Mass mention → Immediate action

### 💾 Data Persistence

**Configuration Storage**:
- JSON-based guild configs
- Environment variable fallbacks
- Runtime configuration updates
- Backup and restore capabilities

**Warning System**:
- Per-user warning history
- Escalation tracking
- Automatic cleanup
- Appeal process support

---

## 🛠️ Troubleshooting & Maintenance

### 🔧 Common Issues & Solutions

#### Commands Not Appearing
**Symptoms**: Slash commands don't show in Discord
**Solutions**:
1. Check bot has `applications.commands` scope
2. Verify `CLIENT_ID` in `.env`
3. Restart bot to refresh commands
4. Check console for registration errors
5. Remove `GUILD_ID` for global commands

#### Permission Errors
**Symptoms**: "Missing permissions" errors
**Solutions**:
1. Ensure bot role is high enough in hierarchy
2. Check required permissions are granted
3. Verify channel-specific permissions
4. Use `/setup view` to check configuration

#### Bot Not Responding
**Symptoms**: Bot appears offline or doesn't respond
**Solutions**:
1. Check `TOKEN` validity in `.env`
2. Verify internet connection
3. Check console logs for errors
4. Restart bot process
5. Verify Discord API status

#### Database/Config Issues
**Symptoms**: Settings not saving or loading
**Solutions**:
1. Check `data/` directory permissions
2. Verify JSON file format
3. Check disk space
4. Restart bot to reload configs
5. Use `/setup` commands to reconfigure

### 📋 Maintenance Tasks

#### Daily Maintenance
- Check log files for errors
- Monitor bot uptime
- Review command usage statistics
- Check Discord API status

#### Weekly Maintenance
- Update dependencies if needed
- Review and clean old logs
- Check backup system functionality
- Monitor server performance

#### Monthly Maintenance
- Update bot to latest Discord.js version
- Review and optimize configurations
- Clean old backup files
- Update documentation if needed

### 📊 Monitoring & Logging

#### Log File Analysis
**Log Locations**: `logs/` directory
**Log Format**: `[timestamp] [level] message`
**Key Patterns**:
- ERROR: Immediate attention needed
- WARN: Monitor for frequency
- INFO: Normal operation
- DEBUG: Development information

#### Performance Monitoring
**Key Metrics**:
- Command response time
- Memory usage
- API call frequency
- Error rates
- User engagement

#### Health Checks
**Regular Checks**:
- Bot online status
- Command registration status
- Database connectivity
- Log file growth
- Configuration integrity

### 🔄 Updates & Upgrades

#### Updating Dependencies
```bash
npm update
npm audit fix
```

#### Bot Updates
1. Backup current configuration
2. Download new version
3. Compare configurations
4. Test in development server
5. Deploy to production
6. Verify all features working

#### Database Migration
When updating data structures:
1. Create backup of `data/` directory
2. Run migration scripts if provided
3. Verify data integrity
4. Test critical functions
5. Monitor for issues

---

## 🎓 Best Practices

### 🔒 Security
- Keep bot token secure and never share
- Use environment variables for sensitive data
- Regularly rotate tokens if compromised
- Monitor for unusual activity
- Implement proper error handling

### 🚀 Performance
- Use efficient database queries
- Implement proper rate limiting
- Monitor memory usage
- Optimize command response times
- Use bulk operations where possible

### 👥 User Experience
- Provide clear error messages
- Use consistent command naming
- Implement helpful feedback
- Maintain responsive interactions
- Document all features clearly

### 🔧 Development
- Follow modular architecture
- Use comprehensive logging
- Implement proper error handling
- Write maintainable code
- Document all changes

---

## 📞 Support & Resources

### 🆘 Getting Help
1. **Check logs** in `logs/` directory for error details
2. **Review configuration** with `/setup view`
3. **Verify permissions** in Discord server settings
4. **Check Discord.js documentation** for API changes
5. **Test in development server** before production changes

### 📚 Additional Resources
- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Bot Hosting Services](https://railway.app/, https://heroku.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

### 🤝 Community
- Discord.js Community Server
- GitHub Issues for bug reports
- Stack Overflow for technical questions
- Reddit r/discordjs community

---

**✨ Congratulations! You now have a complete understanding of the MrToxic Discord Bot system. This documentation covers everything you need to successfully deploy, configure, and maintain your bot. Happy botting! ✨**