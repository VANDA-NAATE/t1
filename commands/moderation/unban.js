const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            const userId = interaction.options.getString('user_id');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            // Check if user ID is valid
            if (!/^\d{17,19}$/.test(userId)) {
                return await interaction.reply({
                    content: 'Please provide a valid Discord user ID (17-19 digits).',
                    ephemeral: true
                });
            }

            // Check if user is actually banned
            try {
                const banInfo = await interaction.guild.bans.fetch(userId);
                if (!banInfo) {
                    return await interaction.reply({
                        content: 'This user is not banned from the server.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                return await interaction.reply({
                    content: 'This user is not banned from the server or the user ID is invalid.',
                    ephemeral: true
                });
            }

            // Unban the user
            await interaction.guild.members.unban(userId, reason);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔓 User Unbanned')
                .addFields(
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`User ${userId} was unbanned by ${interaction.user.tag} for: ${reason}`);

        } catch (error) {
            logger.error('Error executing unban command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to unban the user.',
                ephemeral: true
            });
        }
    }
};