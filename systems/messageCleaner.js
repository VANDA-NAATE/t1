const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const logger = require('../utils/logger');

// This system provides a slash command for message cleaning
module.exports = {
    name: 'messageCleaner',
    
    // Initialize the system by registering the command
    init(client) {
        // Add the clean command to the client's command collection
        const cleanCommand = {
            data: new SlashCommandBuilder()
                .setName('clean')
                .setDescription('Delete messages in a channel')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('age')
                        .setDescription('Delete messages older than specified time')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel to clean (defaults to current)')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('duration')
                                .setDescription('Age of messages to delete (e.g., 90d, 7d, 24h)')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('between')
                        .setDescription('Delete messages between two dates')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel to clean (defaults to current)')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName('start_date')
                                .setDescription('Start date (YYYY-MM-DD or YYYY-MM-DD HH:MM)')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('end_date')
                                .setDescription('End date (YYYY-MM-DD or YYYY-MM-DD HH:MM)')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('count')
                        .setDescription('Delete a specific number of recent messages')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('Channel to clean (defaults to current)')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(false))
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription('Number of messages to delete (1-100)')
                                .setMinValue(1)
                                .setMaxValue(100)
                                .setRequired(true)))
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

            async execute(interaction) {
                try {
                    await interaction.deferReply({ ephemeral: true });

                    const subcommand = interaction.options.getSubcommand();
                    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

                    // Check permissions
                    if (!targetChannel.permissionsFor(interaction.client.user).has([
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages
                    ])) {
                        return await interaction.editReply({
                            content: 'I don\'t have permission to read message history or manage messages in that channel.'
                        });
                    }

                    let messagesToDelete = [];
                    let cutoffDate;

                    switch (subcommand) {
                        case 'age':
                            const duration = interaction.options.getString('duration');
                            cutoffDate = this.parseDuration(duration);
                            
                            if (!cutoffDate) {
                                return await interaction.editReply({
                                    content: 'Invalid duration format. Use format like: 90d, 7d, 24h, 30m'
                                });
                            }

                            messagesToDelete = await this.getMessagesByAge(targetChannel, cutoffDate);
                            break;

                        case 'between':
                            const startDate = this.parseDate(interaction.options.getString('start_date'));
                            const endDate = this.parseDate(interaction.options.getString('end_date'));

                            if (!startDate || !endDate) {
                                return await interaction.editReply({
                                    content: 'Invalid date format. Use format: YYYY-MM-DD or YYYY-MM-DD HH:MM'
                                });
                            }

                            if (startDate >= endDate) {
                                return await interaction.editReply({
                                    content: 'Start date must be before end date.'
                                });
                            }

                            messagesToDelete = await this.getMessagesBetweenDates(targetChannel, startDate, endDate);
                            break;

                        case 'count':
                            const amount = interaction.options.getInteger('amount');
                            messagesToDelete = await this.getRecentMessages(targetChannel, amount);
                            break;
                    }

                    if (messagesToDelete.length === 0) {
                        return await interaction.editReply({
                            content: 'No messages found matching the specified criteria.'
                        });
                    }

                    // Delete messages in batches
                    let deletedCount = 0;
                    const results = await this.deleteMessagesBatch(targetChannel, messagesToDelete);
                    deletedCount = results.deleted;

                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🗑️ Message Cleanup Complete')
                        .addFields(
                            { name: 'Channel', value: targetChannel.toString(), inline: true },
                            { name: 'Messages Deleted', value: deletedCount.toString(), inline: true },
                            { name: 'Method', value: subcommand, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({
                            text: `Cleaned by ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL()
                        });

                    if (results.failed > 0) {
                        embed.addFields({
                            name: 'Failed to Delete',
                            value: `${results.failed} messages (likely too old)`,
                            inline: true
                        });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    
                    logger.info(`Message cleanup completed by ${interaction.user.tag} in #${targetChannel.name}: ${deletedCount} messages deleted`);

                } catch (error) {
                    logger.error('Error executing clean command:', error);
                    await interaction.editReply({
                        content: 'An error occurred while cleaning messages.'
                    });
                }
            },

            // Helper methods for the clean command
            parseDuration(durationStr) {
                const regex = /^(\d+)([smhd])$/i;
                const match = durationStr.match(regex);
                
                if (!match) return null;
                
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                
                const now = new Date();
                let milliseconds;
                
                switch (unit) {
                    case 's': milliseconds = value * 1000; break;
                    case 'm': milliseconds = value * 60 * 1000; break;
                    case 'h': milliseconds = value * 60 * 60 * 1000; break;
                    case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
                    default: return null;
                }
                
                return new Date(now.getTime() - milliseconds);
            },

            parseDate(dateStr) {
                // Try different date formats
                const formats = [
                    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
                    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/ // YYYY-MM-DD HH:MM
                ];

                for (const format of formats) {
                    const match = dateStr.match(format);
                    if (match) {
                        if (match.length === 4) {
                            // YYYY-MM-DD
                            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                        } else if (match.length === 6) {
                            // YYYY-MM-DD HH:MM
                            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
                        }
                    }
                }
                
                return null;
            },

            async getMessagesByAge(channel, cutoffDate) {
                const messages = [];
                let lastMessageId = null;

                while (messages.length < 1000) { // Limit to prevent excessive API calls
                    const options = { limit: 100 };
                    if (lastMessageId) options.before = lastMessageId;

                    const batch = await channel.messages.fetch(options);
                    if (batch.size === 0) break;

                    for (const message of batch.values()) {
                        if (message.createdAt < cutoffDate) {
                            messages.push(message);
                        }
                    }

                    lastMessageId = batch.last().id;
                    
                    // If oldest message in batch is newer than cutoff, we can stop
                    if (batch.last().createdAt >= cutoffDate) break;
                }

                return messages;
            },

            async getMessagesBetweenDates(channel, startDate, endDate) {
                const messages = [];
                let lastMessageId = null;

                while (messages.length < 1000) {
                    const options = { limit: 100 };
                    if (lastMessageId) options.before = lastMessageId;

                    const batch = await channel.messages.fetch(options);
                    if (batch.size === 0) break;

                    for (const message of batch.values()) {
                        if (message.createdAt >= startDate && message.createdAt <= endDate) {
                            messages.push(message);
                        }
                    }

                    lastMessageId = batch.last().id;
                    
                    // If oldest message in batch is newer than end date, we can stop
                    if (batch.last().createdAt < startDate) break;
                }

                return messages;
            },

            async getRecentMessages(channel, count) {
                const messages = await channel.messages.fetch({ limit: count });
                return Array.from(messages.values());
            },

            async deleteMessagesBatch(channel, messages) {
                let deleted = 0;
                let failed = 0;
                
                // Separate messages by age (Discord bulk delete only works on messages < 14 days old)
                const recentMessages = [];
                const oldMessages = [];
                const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

                for (const message of messages) {
                    if (message.createdAt > twoWeeksAgo) {
                        recentMessages.push(message);
                    } else {
                        oldMessages.push(message);
                    }
                }

                // Bulk delete recent messages
                while (recentMessages.length > 0) {
                    const batch = recentMessages.splice(0, 100);
                    
                    try {
                        if (batch.length === 1) {
                            await batch[0].delete();
                            deleted += 1;
                        } else {
                            await channel.bulkDelete(batch);
                            deleted += batch.length;
                        }
                        
                        // Rate limit protection
                        if (recentMessages.length > 0) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (error) {
                        logger.error('Error bulk deleting messages:', error);
                        failed += batch.length;
                    }
                }

                // Individual delete for old messages
                for (const message of oldMessages) {
                    try {
                        await message.delete();
                        deleted += 1;
                        
                        // Longer delay for individual deletions to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        failed += 1;
                    }
                }

                return { deleted, failed };
            }
        };

        // Add the command to the client's collection
        client.commands.set(cleanCommand.data.name, cleanCommand);
        logger.info('Message Cleaner system initialized with /clean command');
    }
};
