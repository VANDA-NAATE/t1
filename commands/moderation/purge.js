const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages with various filters')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('contains')
                .setDescription('Only delete messages containing this text')
                .setRequired(false)
                .setMaxLength(100))
        .addBooleanOption(option =>
            option.setName('bots_only')
                .setDescription('Only delete messages from bots')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('embeds_only')
                .setDescription('Only delete messages with embeds')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('attachments_only')
                .setDescription('Only delete messages with attachments')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const amount = interaction.options.getInteger('amount');
            const targetUser = interaction.options.getUser('user');
            const containsText = interaction.options.getString('contains');
            const botsOnly = interaction.options.getBoolean('bots_only');
            const embedsOnly = interaction.options.getBoolean('embeds_only');
            const attachmentsOnly = interaction.options.getBoolean('attachments_only');

            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ 
                limit: Math.min(amount * 2, 100) // Fetch more to account for filtering
            });

            let toDelete = Array.from(messages.values());

            // Apply filters
            if (targetUser) {
                toDelete = toDelete.filter(msg => msg.author.id === targetUser.id);
            }

            if (containsText) {
                const searchText = containsText.toLowerCase();
                toDelete = toDelete.filter(msg => 
                    msg.content.toLowerCase().includes(searchText)
                );
            }

            if (botsOnly) {
                toDelete = toDelete.filter(msg => msg.author.bot);
            }

            if (embedsOnly) {
                toDelete = toDelete.filter(msg => msg.embeds.length > 0);
            }

            if (attachmentsOnly) {
                toDelete = toDelete.filter(msg => msg.attachments.size > 0);
            }

            // Limit to requested amount
            toDelete = toDelete.slice(0, amount);

            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const recentMessages = toDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = toDelete.filter(msg => msg.createdTimestamp <= twoWeeksAgo);

            let deletedCount = 0;

            // Bulk delete recent messages
            if (recentMessages.length > 0) {
                if (recentMessages.length === 1) {
                    await recentMessages[0].delete();
                    deletedCount = 1;
                } else {
                    const deleted = await interaction.channel.bulkDelete(recentMessages, true);
                    deletedCount = deleted.size;
                }
            }

            // Individual delete for old messages
            if (oldMessages.length > 0) {
                for (const msg of oldMessages.slice(0, 10)) { // Limit to avoid rate limits
                    try {
                        await msg.delete();
                        deletedCount++;
                        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
                    } catch (error) {
                        logger.warn(`Could not delete old message: ${error.message}`);
                    }
                }
            }

            // Create filter description
            const filters = [];
            if (targetUser) filters.push(`from ${targetUser.tag}`);
            if (containsText) filters.push(`containing "${containsText}"`);
            if (botsOnly) filters.push('from bots only');
            if (embedsOnly) filters.push('with embeds only');
            if (attachmentsOnly) filters.push('with attachments only');

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🗑️ Messages Purged')
                .addFields(
                    { name: 'Deleted', value: deletedCount.toString(), inline: true },
                    { name: 'Requested', value: amount.toString(), inline: true },
                    { name: 'Channel', value: interaction.channel.toString(), inline: true }
                );

            if (filters.length > 0) {
                embed.addFields({
                    name: 'Filters Applied',
                    value: filters.join('\n'),
                    inline: false
                });
            }

            if (oldMessages.length > deletedCount - recentMessages.length) {
                embed.addFields({
                    name: 'Note',
                    value: `Some messages older than 14 days couldn't be bulk deleted and were skipped.`,
                    inline: false
                });
            }

            embed.setTimestamp()
                .setFooter({
                    text: `Executed by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.editReply({ embeds: [embed] });

            // Log the action
            logger.info(`Purge executed by ${interaction.user.tag} in #${interaction.channel.name}: ${deletedCount} messages deleted`);

        } catch (error) {
            logger.error('Error executing purge command:', error);
            await interaction.editReply({
                content: 'An error occurred while purging messages. Make sure I have the necessary permissions.'
            });
        }
    }
};