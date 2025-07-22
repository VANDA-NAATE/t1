const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'antiSpam',
    
    init(client) {
        // Store user message data
        const userMessages = new Map();
        const warnings = new Map();
        
        // Anti-spam settings
        const SPAM_THRESHOLD = 5; // messages
        const SPAM_WINDOW = 5000; // 5 seconds
        const DUPLICATE_THRESHOLD = 3; // duplicate messages
        const WARNING_THRESHOLD = 3; // warnings before action
        
        client.on(Events.MessageCreate, async (message) => {
            try {
                // Ignore bots, system messages, and DMs
                if (message.author.bot || !message.guild || message.system) return;
                
                // Ignore administrators and moderators
                const member = message.member;
                if (member.permissions.has('Administrator') || 
                    member.permissions.has('ManageMessages')) return;
                
                const userId = message.author.id;
                const guildId = message.guild.id;
                const now = Date.now();
                
                // Initialize user data if needed
                if (!userMessages.has(userId)) {
                    userMessages.set(userId, []);
                }
                
                if (!warnings.has(userId)) {
                    warnings.set(userId, 0);
                }
                
                const messages = userMessages.get(userId);
                const userWarnings = warnings.get(userId);
                
                // Add current message
                messages.push({
                    content: message.content.toLowerCase(),
                    timestamp: now,
                    channelId: message.channel.id
                });
                
                // Clean old messages (older than spam window)
                const recentMessages = messages.filter(msg => 
                    now - msg.timestamp < SPAM_WINDOW
                );
                userMessages.set(userId, recentMessages);
                
                // Check for spam patterns
                let violation = null;
                
                // 1. Check message frequency
                if (recentMessages.length >= SPAM_THRESHOLD) {
                    violation = {
                        type: 'frequency',
                        description: `Sending ${recentMessages.length} messages in ${SPAM_WINDOW / 1000} seconds`
                    };
                }
                
                // 2. Check for duplicate messages
                const duplicateCount = recentMessages.filter(msg => 
                    msg.content === message.content.toLowerCase()
                ).length;
                
                if (duplicateCount >= DUPLICATE_THRESHOLD) {
                    violation = {
                        type: 'duplicate',
                        description: `Repeating the same message ${duplicateCount} times`
                    };
                }
                
                // 3. Check for caps spam (if message is long and mostly caps)
                if (message.content.length > 20 && 
                    message.content === message.content.toUpperCase() &&
                    message.content.replace(/[^A-Z]/g, '').length > message.content.length * 0.7) {
                    violation = {
                        type: 'caps',
                        description: 'Excessive use of capital letters'
                    };
                }
                
                // 4. Check for mention spam
                const mentionCount = (message.mentions.users.size + message.mentions.roles.size);
                if (mentionCount >= 5) {
                    violation = {
                        type: 'mentions',
                        description: `Mentioning ${mentionCount} users/roles in one message`
                    };
                }
                
                // Handle violation
                if (violation) {
                    await this.handleSpamViolation(message, violation, userWarnings);
                    warnings.set(userId, userWarnings + 1);
                }
                
            } catch (error) {
                logger.error('Error in anti-spam system:', error);
            }
        });
        
        logger.info('Anti-Spam system initialized');
    },
    
    async handleSpamViolation(message, violation, warningCount) {
        try {
            const member = message.member;
            
            // Delete the spam message
            await message.delete().catch(() => {});
            
            // Determine action based on warning count
            let action = 'warning';
            let duration = null;
            
            if (warningCount >= 2) {
                action = 'timeout';
                duration = Math.min(5 * Math.pow(2, warningCount - 2), 60); // Exponential backoff, max 60 minutes
            }
            
            // Create violation embed
            const embed = new EmbedBuilder()
                .setColor(warningCount >= 2 ? '#FF0000' : '#FFA500')
                .setTitle(`🚫 Anti-Spam Detection`)
                .addFields(
                    { name: 'User', value: `${message.author} (${message.author.tag})`, inline: true },
                    { name: 'Violation', value: violation.description, inline: true },
                    { name: 'Warning Count', value: (warningCount + 1).toString(), inline: true },
                    { name: 'Action', value: action === 'timeout' ? `${duration} minute timeout` : 'Warning', inline: true }
                )
                .setTimestamp();
            
            // Apply timeout if needed
            if (action === 'timeout' && member.moderatable) {
                await member.timeout(duration * 60 * 1000, `Anti-spam: ${violation.description}`);
                embed.addFields({
                    name: 'Status',
                    value: `User has been timed out for ${duration} minutes`,
                    inline: false
                });
            }
            
            // Send warning to channel
            const warningMsg = await message.channel.send({
                content: `${message.author}, please slow down and follow our community guidelines.`,
                embeds: [embed]
            });
            
            // Auto-delete warning message after 10 seconds
            setTimeout(async () => {
                await warningMsg.delete().catch(() => {});
            }, 10000);
            
            // Try to DM user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Spam Detection')
                    .setDescription(`Your message in **${message.guild.name}** was flagged for spam.`)
                    .addFields(
                        { name: 'Reason', value: violation.description, inline: false },
                        { name: 'Action', value: action === 'timeout' ? `You have been timed out for ${duration} minutes` : 'This is a warning', inline: false }
                    )
                    .setTimestamp();
                
                await message.author.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                // User has DMs disabled
            }
            
            logger.info(`Anti-spam action taken: ${message.author.tag} - ${violation.type} - ${action}`);
            
        } catch (error) {
            logger.error('Error handling spam violation:', error);
        }
    }
};