const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const deleteDays = interaction.options.getInteger('delete_days') || 0;
            
            // Check if user is already banned
            try {
                const banInfo = await interaction.guild.bans.fetch(user.id);
                if (banInfo) {
                    return await interaction.reply({
                        content: 'This user is already banned.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                // User is not banned, continue
            }

            // Check if user is in the guild
            let member = null;
            try {
                member = await interaction.guild.members.fetch(user.id);
            } catch (error) {
                // User is not in the guild, but we can still ban by ID
            }

            // If member exists, check if they can be banned
            if (member) {
                if (!member.bannable) {
                    return await interaction.reply({
                        content: 'I cannot ban this user. They may have higher permissions than me.',
                        ephemeral: true
                    });
                }

                if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return await interaction.reply({
                        content: 'I cannot ban administrators.',
                        ephemeral: true
                    });
                }

                // Try to DM the user before banning
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#8B0000')
                        .setTitle('You have been banned')
                        .addFields(
                            { name: 'Server', value: interaction.guild.name, inline: true },
                            { name: 'Reason', value: reason, inline: false },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    // User has DMs disabled or blocked the bot
                    logger.warn(`Could not DM user ${user.tag} about ban`);
                }
            }

            // Ban the user
            await interaction.guild.members.ban(user, {
                deleteMessageSeconds: deleteDays * 24 * 60 * 60,
                reason: reason
            });

            const embed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('🔨 User Banned')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Messages Deleted', value: `${deleteDays} days`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`User ${user.tag} was banned by ${interaction.user.tag} for: ${reason}`);

        } catch (error) {
            logger.error('Error executing ban command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to ban the user.',
                ephemeral: true
            });
        }
    }
};
