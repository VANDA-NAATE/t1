const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create and send a custom embedded message')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the embed')
                .setRequired(false)
                .setMaxLength(256))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Main content of the embed')
                .setRequired(false)
                .setMaxLength(4096))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color code (e.g., #FF5733)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL for the main embed image')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('URL for the embed thumbnail')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('Footer text')
                .setRequired(false)
                .setMaxLength(2048))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the embed to (defaults to current channel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const color = interaction.options.getString('color');
            const image = interaction.options.getString('image');
            const thumbnail = interaction.options.getString('thumbnail');
            const footer = interaction.options.getString('footer');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Validate that at least one content field is provided
            if (!title && !description && !image && !thumbnail) {
                return await interaction.reply({
                    content: 'You must provide at least a title, description, image, or thumbnail for the embed.',
                    ephemeral: true
                });
            }

            // Validate color format
            let embedColor = '#5865F2'; // Default Discord blurple
            if (color) {
                const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                if (colorRegex.test(color)) {
                    embedColor = color;
                } else {
                    return await interaction.reply({
                        content: 'Invalid color format. Please use hex format like #FF5733',
                        ephemeral: true
                    });
                }
            }

            // Validate URLs
            const isValidUrl = (string) => {
                try {
                    const url = new URL(string);
                    return url.protocol === 'http:' || url.protocol === 'https:';
                } catch {
                    return false;
                }
            };

            if (image && !isValidUrl(image)) {
                return await interaction.reply({
                    content: 'Invalid image URL. Please provide a valid HTTP/HTTPS URL.',
                    ephemeral: true
                });
            }

            if (thumbnail && !isValidUrl(thumbnail)) {
                return await interaction.reply({
                    content: 'Invalid thumbnail URL. Please provide a valid HTTP/HTTPS URL.',
                    ephemeral: true
                });
            }

            // Check permissions for target channel
            if (!targetChannel.permissionsFor(interaction.client.user).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                return await interaction.reply({
                    content: 'I don\'t have permission to send messages or embeds in that channel.',
                    ephemeral: true
                });
            }

            // Create the embed
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTimestamp();

            if (title) embed.setTitle(title);
            if (description) embed.setDescription(description);
            if (image) embed.setImage(image);
            if (thumbnail) embed.setThumbnail(thumbnail);
            if (footer) embed.setFooter({ text: footer });

            // Send the embed
            await targetChannel.send({ embeds: [embed] });

            // Confirm to user
            const confirmMessage = targetChannel.id === interaction.channel.id 
                ? '✅ Embed sent successfully!' 
                : `✅ Embed sent successfully to ${targetChannel}!`;

            await interaction.reply({
                content: confirmMessage,
                ephemeral: true
            });

            logger.info(`Embed created by ${interaction.user.tag} in #${targetChannel.name}`);

        } catch (error) {
            logger.error('Error executing embed command:', error);
            
            // Handle specific Discord API errors
            if (error.code === 50035) {
                await interaction.reply({
                    content: 'Invalid embed data. Please check your input and try again.',
                    ephemeral: true
                });
            } else if (error.code === 50013) {
                await interaction.reply({
                    content: 'I don\'t have permission to send messages in that channel.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred while creating the embed. Please try again.',
                    ephemeral: true
                });
            }
        }
    }
};
