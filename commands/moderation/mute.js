const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 5m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            const member = await interaction.guild.members.fetch(user.id);
            
            // Check if user can be timed out
            if (!member.moderatable) {
                return await interaction.reply({
                    content: 'I cannot timeout this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Parse duration string to milliseconds
            const parseTime = (timeStr) => {
                const regex = /(\d+)([smhd])/g;
                let totalMs = 0;
                let match;
                
                while ((match = regex.exec(timeStr)) !== null) {
                    const value = parseInt(match[1]);
                    const unit = match[2];
                    
                    switch (unit) {
                        case 's': totalMs += value * 1000; break;
                        case 'm': totalMs += value * 60 * 1000; break;
                        case 'h': totalMs += value * 60 * 60 * 1000; break;
                        case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
                        default: return null;
                    }
                }
                
                return totalMs > 0 ? totalMs : null;
            };

            const timeoutDuration = parseTime(duration);
            if (!timeoutDuration || timeoutDuration > 28 * 24 * 60 * 60 * 1000) {
                return await interaction.reply({
                    content: 'Invalid duration format or duration too long. Use format like: 5m, 1h, 1d (max 28 days)',
                    ephemeral: true
                });
            }

            // Apply timeout
            await member.timeout(timeoutDuration, reason);

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🔇 User Timed Out')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`User ${user.tag} was timed out for ${duration} by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Error executing mute command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to timeout the user.',
                ephemeral: true
            });
        }
    }
};
