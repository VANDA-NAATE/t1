const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

// Simple JSON-based warning system
const warningsFile = path.join(__dirname, '../../data/warnings.json');

// Ensure data directory exists
const dataDir = path.dirname(warningsFile);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize warnings file if it doesn't exist
if (!fs.existsSync(warningsFile)) {
    fs.writeFileSync(warningsFile, JSON.stringify({}));
}

function loadWarnings() {
    try {
        return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
    } catch (error) {
        logger.error('Error loading warnings:', error);
        return {};
    }
}

function saveWarnings(warnings) {
    try {
        fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
    } catch (error) {
        logger.error('Error saving warnings:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue a warning to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
                .setMaxLength(1000))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            // Can't warn bots or administrators
            if (user.bot) {
                return await interaction.reply({
                    content: 'You cannot warn bots.',
                    ephemeral: true
                });
            }

            if (member && member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: 'You cannot warn administrators.',
                    ephemeral: true
                });
            }

            // Load existing warnings
            const warnings = loadWarnings();
            const guildId = interaction.guild.id;
            const userId = user.id;

            // Initialize guild and user warnings if they don't exist
            if (!warnings[guildId]) warnings[guildId] = {};
            if (!warnings[guildId][userId]) warnings[guildId][userId] = [];

            // Add new warning
            const warningData = {
                id: Date.now().toString(),
                reason: reason,
                moderator: interaction.user.tag,
                moderatorId: interaction.user.id,
                timestamp: new Date().toISOString()
            };

            warnings[guildId][userId].push(warningData);
            saveWarnings(warnings);

            const warningCount = warnings[guildId][userId].length;

            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Warning Issued')
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Warning Count', value: warningCount.toString(), inline: true }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                logger.warn(`Could not DM user ${user.tag} about warning`);
            }

            // Public warning embed
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ User Warned')
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Warning Count', value: warningCount.toString(), inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            
            logger.info(`User ${user.tag} was warned by ${interaction.user.tag} (Warning #${warningCount}): ${reason}`);

        } catch (error) {
            logger.error('Error executing warn command:', error);
            await interaction.reply({
                content: 'An error occurred while issuing the warning.',
                ephemeral: true
            });
        }
    }
};