const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set or remove slowmode in a channel')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable, max 21600)')
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set slowmode in (defaults to current)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for setting slowmode')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const seconds = interaction.options.getInteger('seconds');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if bot has permission to manage the channel
            if (!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.reply({
                    content: 'I don\'t have permission to manage that channel.',
                    ephemeral: true
                });
            }

            await channel.setRateLimitPerUser(seconds, reason);

            const embed = new EmbedBuilder()
                .setTitle('🐌 Slowmode Updated')
                .addFields(
                    { name: 'Channel', value: channel.toString(), inline: true },
                    { name: 'Duration', value: seconds === 0 ? 'Disabled' : `${seconds} seconds`, inline: true },
                    { name: 'Set by', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            if (seconds === 0) {
                embed.setColor('#00FF00');
                embed.setTitle('✅ Slowmode Disabled');
            } else {
                embed.setColor('#FFA500');
            }

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`Slowmode set to ${seconds}s in #${channel.name} by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Error executing slowmode command:', error);
            await interaction.reply({
                content: 'An error occurred while setting slowmode.',
                ephemeral: true
            });
        }
    }
};