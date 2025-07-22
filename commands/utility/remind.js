const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder for yourself or others')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('When to remind (e.g., "5m", "2h", "1d")')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Reminder message')
                .setRequired(true)
                .setMaxLength(500))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remind (defaults to yourself)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('private')
                .setDescription('Send reminder privately (default: false)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const timeString = interaction.options.getString('time');
            const message = interaction.options.getString('message');
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const isPrivate = interaction.options.getBoolean('private') || false;

            // Parse time duration
            const duration = this.parseDuration(timeString);
            if (!duration) {
                return await interaction.reply({
                    content: 'Invalid time format. Use formats like: 5m, 1h, 2d, 1w',
                    ephemeral: true
                });
            }

            const reminderTime = Date.now() + duration;
            const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Store reminder (in a real app, use a persistent database)
            if (!global.reminders) global.reminders = new Map();
            
            const reminderData = {
                id: reminderId,
                userId: targetUser.id,
                channelId: interaction.channel.id,
                message: message,
                creator: interaction.user.id,
                createdAt: Date.now(),
                reminderTime: reminderTime,
                private: isPrivate
            };

            global.reminders.set(reminderId, reminderData);

            // Schedule the reminder
            setTimeout(async () => {
                await this.triggerReminder(interaction.client, reminderData);
            }, duration);

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setColor('#4A90E2')
                .setTitle('⏰ Reminder Set')
                .addFields(
                    { name: 'For', value: targetUser.toString(), inline: true },
                    { name: 'When', value: `<t:${Math.floor(reminderTime / 1000)}:R>`, inline: true },
                    { name: 'Message', value: message, inline: false }
                )
                .setTimestamp()
                .setFooter({
                    text: `Set by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`Reminder set by ${interaction.user.tag} for ${targetUser.tag}: ${timeString}`);

        } catch (error) {
            logger.error('Error executing remind command:', error);
            await interaction.reply({
                content: 'An error occurred while setting the reminder.',
                ephemeral: true
            });
        }
    },

    parseDuration(timeString) {
        const regex = /^(\d+)([smhdw])$/i;
        const match = timeString.match(regex);
        
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        const multipliers = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        };
        
        const duration = value * multipliers[unit];
        
        // Max 1 month (30 days)
        if (duration > 30 * 24 * 60 * 60 * 1000) return null;
        
        return duration;
    },

    async triggerReminder(client, reminderData) {
        try {
            const user = await client.users.fetch(reminderData.userId);
            const channel = await client.channels.fetch(reminderData.channelId);
            const creator = await client.users.fetch(reminderData.creator);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('⏰ Reminder!')
                .setDescription(reminderData.message)
                .addFields({
                    name: 'Set by',
                    value: creator.tag,
                    inline: true
                })
                .addFields({
                    name: 'Set',
                    value: `<t:${Math.floor(reminderData.createdAt / 1000)}:R>`,
                    inline: true
                })
                .setTimestamp();

            if (reminderData.private) {
                // Send private DM
                try {
                    await user.send({ embeds: [embed] });
                } catch (dmError) {
                    // If DM fails, send in channel with mention
                    await channel.send({
                        content: `${user}, I couldn't send you a private reminder:`,
                        embeds: [embed]
                    });
                }
            } else {
                // Send in channel
                await channel.send({
                    content: `${user}`,
                    embeds: [embed]
                });
            }

            // Clean up
            if (global.reminders) {
                global.reminders.delete(reminderData.id);
            }

            logger.info(`Reminder triggered for ${user.tag}: ${reminderData.message}`);

        } catch (error) {
            logger.error('Error triggering reminder:', error);
        }
    }
};