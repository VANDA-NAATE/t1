const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot repeat your message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to repeat')
                .setRequired(true)
                .setMaxLength(2000))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the message to (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            const message = interaction.options.getString('message');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Basic content filtering
            const forbiddenWords = ['@everyone', '@here'];
            const lowercaseMessage = message.toLowerCase();
            
            for (const word of forbiddenWords) {
                if (lowercaseMessage.includes(word)) {
                    return await interaction.reply({
                        content: 'Message contains forbidden content that could be used for spam or abuse.',
                        ephemeral: true
                    });
                }
            }

            // Check if bot has permission to send messages in target channel
            if (!targetChannel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
                return await interaction.reply({
                    content: 'I don\'t have permission to send messages in that channel.',
                    ephemeral: true
                });
            }

            // Send the message to target channel
            await targetChannel.send({
                content: message,
                allowedMentions: { 
                    parse: [], // Disable all mentions for security
                    users: [],
                    roles: []
                }
            });

            // Confirm to user
            const confirmMessage = targetChannel.id === interaction.channel.id 
                ? 'Message sent!' 
                : `Message sent to ${targetChannel}!`;

            await interaction.reply({
                content: confirmMessage,
                ephemeral: true
            });

            logger.info(`Say command used by ${interaction.user.tag} in #${targetChannel.name}: "${message}"`);

        } catch (error) {
            logger.error('Error executing say command:', error);
            await interaction.reply({
                content: 'An error occurred while trying to send the message.',
                ephemeral: true
            });
        }
    }
};
