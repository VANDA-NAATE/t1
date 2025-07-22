const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
    try {
        if (!fs.existsSync(warningsFile)) return {};
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    } catch (error) {
        logger.error('Error loading warnings:', error);
        return {};
    }
}

function saveWarnings(warnings) {
    try {
        const dataDir = path.dirname(warningsFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
    } catch (error) {
        logger.error('Error saving warnings:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Manage user warnings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove warning from')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('warning_id')
                        .setDescription('The warning ID to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to clear warnings for')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const user = interaction.options.getUser('user');
            const warnings = loadWarnings();
            const guildId = interaction.guild.id;
            const userId = user.id;

            const userWarnings = warnings[guildId]?.[userId] || [];

            switch (subcommand) {
                case 'view':
                    if (userWarnings.length === 0) {
                        return await interaction.reply({
                            content: `${user.tag} has no warnings.`,
                            ephemeral: true
                        });
                    }

                    const embed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle(`⚠️ Warnings for ${user.tag}`)
                        .setDescription(`Total warnings: ${userWarnings.length}`)
                        .setThumbnail(user.displayAvatarURL());

                    userWarnings.slice(-10).forEach((warning, index) => {
                        const date = new Date(warning.timestamp).toLocaleDateString();
                        embed.addFields({
                            name: `Warning #${userWarnings.length - index} (ID: ${warning.id})`,
                            value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** ${date}`,
                            inline: false
                        });
                    });

                    if (userWarnings.length > 10) {
                        embed.setFooter({ text: `Showing last 10 warnings out of ${userWarnings.length}` });
                    }

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;

                case 'remove':
                    const warningId = interaction.options.getString('warning_id');
                    const warningIndex = userWarnings.findIndex(w => w.id === warningId);

                    if (warningIndex === -1) {
                        return await interaction.reply({
                            content: 'Warning not found. Use `/warnings view` to see warning IDs.',
                            ephemeral: true
                        });
                    }

                    const removedWarning = userWarnings.splice(warningIndex, 1)[0];
                    
                    // Clean up empty entries
                    if (userWarnings.length === 0) {
                        delete warnings[guildId][userId];
                        if (Object.keys(warnings[guildId]).length === 0) {
                            delete warnings[guildId];
                        }
                    }
                    
                    saveWarnings(warnings);

                    const removeEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Warning Removed')
                        .addFields(
                            { name: 'User', value: user.tag, inline: true },
                            { name: 'Warning ID', value: warningId, inline: true },
                            { name: 'Original Reason', value: removedWarning.reason, inline: false },
                            { name: 'Removed by', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [removeEmbed] });
                    logger.info(`Warning ${warningId} removed from ${user.tag} by ${interaction.user.tag}`);
                    break;

                case 'clear':
                    if (userWarnings.length === 0) {
                        return await interaction.reply({
                            content: `${user.tag} has no warnings to clear.`,
                            ephemeral: true
                        });
                    }

                    const warningCount = userWarnings.length;
                    
                    // Remove all warnings for user
                    delete warnings[guildId][userId];
                    if (Object.keys(warnings[guildId]).length === 0) {
                        delete warnings[guildId];
                    }
                    
                    saveWarnings(warnings);

                    const clearEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🗑️ Warnings Cleared')
                        .addFields(
                            { name: 'User', value: user.tag, inline: true },
                            { name: 'Warnings Cleared', value: warningCount.toString(), inline: true },
                            { name: 'Cleared by', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [clearEmbed] });
                    logger.info(`All ${warningCount} warnings cleared for ${user.tag} by ${interaction.user.tag}`);
                    break;
            }

        } catch (error) {
            logger.error('Error executing warnings command:', error);
            await interaction.reply({
                content: 'An error occurred while managing warnings.',
                ephemeral: true
            });
        }
    }
};