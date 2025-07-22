const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            const member = await interaction.guild.members.fetch(user.id);
            
            // Check if user can be kicked
            if (!member.kickable) {
                return await interaction.reply({
                    content: 'I cannot kick this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Check if trying to kick bot owner or moderators
            if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: 'I cannot kick administrators.',
                    ephemeral: true
                });
            }

            // Try to DM the user before kicking
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('You have been kicked')
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Moderator', value: interaction.user.tag, inline: true }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                // User has DMs disabled or blocked the bot
                logger.warn(`Could not DM user ${user.tag} about kick`);
            }

            // Kick the user
            await member.kick(reason);

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('👢 User Kicked')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`User ${user.tag} was kicked by ${interaction.user.tag} for: ${reason}`);

        } catch (error) {
            logger.error('Error executing kick command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to kick the user.',
                ephemeral: true
            });
        }
    }
};
