const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        // Create logs directory if it doesn't exist
        this.logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }

        // Create log files with current date
        const today = new Date().toISOString().split('T')[0];
        this.logFile = path.join(this.logsDir, `bot-${today}.log`);
        this.errorFile = path.join(this.logsDir, `error-${today}.log`);
    }

    // Format timestamp for logs
    getTimestamp() {
        return new Date().toISOString();
    }

    // Get colored output for console
    getColorCode(level) {
        const colors = {
            INFO: '\x1b[32m',  // Green
            WARN: '\x1b[33m',  // Yellow
            ERROR: '\x1b[31m', // Red
            DEBUG: '\x1b[36m', // Cyan
            RESET: '\x1b[0m'   // Reset
        };
        return colors[level] || colors.RESET;
    }

    // Core logging method
    log(level, message, ...args) {
        const timestamp = this.getTimestamp();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        
        // Additional arguments handling
        if (args.length > 0) {
            const additionalInfo = args.map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                }
                return String(arg);
            }).join(' ');
            
            console.log(`${this.getColorCode(level)}${logMessage}${this.getColorCode('RESET')}`);
            console.log(`${this.getColorCode(level)}${additionalInfo}${this.getColorCode('RESET')}`);
        } else {
            console.log(`${this.getColorCode(level)}${logMessage}${this.getColorCode('RESET')}`);
        }

        // Write to file
        try {
            const fileMessage = args.length > 0 
                ? `${logMessage}\n${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join('\n')}\n`
                : `${logMessage}\n`;
                
            fs.appendFileSync(this.logFile, fileMessage);
            
            // Also write errors to separate error log
            if (level === 'ERROR') {
                fs.appendFileSync(this.errorFile, fileMessage);
            }
        } catch (writeError) {
            console.error('Failed to write to log file:', writeError);
        }
    }

    // Convenience methods
    info(message, ...args) {
        this.log('INFO', message, ...args);
    }

    warn(message, ...args) {
        this.log('WARN', message, ...args);
    }

    error(message, ...args) {
        this.log('ERROR', message, ...args);
    }

    debug(message, ...args) {
        this.log('DEBUG', message, ...args);
    }

    // Special method for command logging
    command(commandName, user, guild, success = true) {
        const guildName = guild ? guild.name : 'DM';
        const status = success ? 'SUCCESS' : 'FAILED';
        this.info(`COMMAND [${status}] ${commandName} executed by ${user.tag} (${user.id}) in ${guildName}`);
    }

    // Special method for member events
    member(event, member, details = '') {
        this.info(`MEMBER [${event}] ${member.user.tag} (${member.user.id}) in ${member.guild.name} ${details}`);
    }

    // Clean up old log files (keep last 30 days)
    cleanOldLogs() {
        try {
            if (!fs.existsSync(this.logsDir)) return;

            const files = fs.readdirSync(this.logsDir);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            files.forEach(file => {
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    this.info(`Cleaned up old log file: ${file}`);
                }
            });
        } catch (error) {
            this.error('Error cleaning old logs:', error);
        }
    }

    // Get recent logs for debugging
    getRecentLogs(lines = 50) {
        try {
            if (!fs.existsSync(this.logFile)) {
                return 'No log file found for today.';
            }

            const content = fs.readFileSync(this.logFile, 'utf8');
            const logLines = content.split('\n').filter(line => line.length > 0);
            
            return logLines.slice(-lines).join('\n');
        } catch (error) {
            this.error('Error reading log file:', error);
            return 'Error reading log file.';
        }
    }

    // Get error logs
    getErrorLogs(lines = 50) {
        try {
            if (!fs.existsSync(this.errorFile)) {
                return 'No error log file found for today.';
            }

            const content = fs.readFileSync(this.errorFile, 'utf8');
            const logLines = content.split('\n').filter(line => line.length > 0);
            
            return logLines.slice(-lines).join('\n');
        } catch (error) {
            this.error('Error reading error log file:', error);
            return 'Error reading error log file.';
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

// Set up periodic cleanup (daily)
setInterval(() => {
    logger.cleanOldLogs();
}, 24 * 60 * 60 * 1000);

module.exports = logger;
