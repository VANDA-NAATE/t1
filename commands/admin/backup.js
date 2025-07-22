const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Create a backup of server settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a backup of current server settings')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name for this backup')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available backups'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'create') {
                await this.createBackup(interaction);
            } else if (subcommand === 'list') {
                await this.listBackups(interaction);
            }

        } catch (error) {
            logger.error('Error executing backup command:', error);
            await interaction.reply({
                content: 'An error occurred while managing backups.',
                ephemeral: true
            });
        }
    },

    async createBackup(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;
            const backupName = interaction.options.getString('name') || `backup-${Date.now()}`;
            
            // Gather server data
            const backupData = {
                name: backupName,
                created: new Date().toISOString(),
                guild: {
                    name: guild.name,
                    description: guild.description,
                    icon: guild.iconURL(),
                    banner: guild.bannerURL(),
                    verificationLevel: guild.verificationLevel,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    explicitContentFilter: guild.explicitContentFilter
                },
                roles: [],
                channels: [],
                settings: {
                    systemChannelId: guild.systemChannelId,
                    rulesChannelId: guild.rulesChannelId,
                    publicUpdatesChannelId: guild.publicUpdatesChannelId
                }
            };

            // Backup roles (excluding @everyone and managed roles)
            guild.roles.cache
                .filter(role => !role.managed && role.id !== guild.id)
                .forEach(role => {
                    backupData.roles.push({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        position: role.position,
                        permissions: role.permissions.toString(),
                        mentionable: role.mentionable
                    });
                });

            // Backup channels
            guild.channels.cache.forEach(channel => {
                const channelData = {
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parentId: channel.parentId
                };

                if (channel.topic) channelData.topic = channel.topic;
                if (channel.nsfw !== undefined) channelData.nsfw = channel.nsfw;
                if (channel.rateLimitPerUser) channelData.rateLimitPerUser = channel.rateLimitPerUser;
                
                backupData.channels.push(channelData);
            });

            // Save backup to file
            const backupDir = path.join(__dirname, '../../backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const filename = `${guild.id}_${backupName}.json`;
            const filepath = path.join(backupDir, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Backup Created')
                .addFields(
                    { name: 'Name', value: backupName, inline: true },
                    { name: 'Roles Backed Up', value: backupData.roles.length.toString(), inline: true },
                    { name: 'Channels Backed Up', value: backupData.channels.length.toString(), inline: true },
                    { name: 'File Size', value: `${Math.round(fs.statSync(filepath).size / 1024)}KB`, inline: true }
                )
                .setTimestamp();

            // Send backup file
            const attachment = new AttachmentBuilder(filepath, { name: filename });

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

            logger.info(`Server backup created by ${interaction.user.tag}: ${backupName}`);

        } catch (error) {
            logger.error('Error creating backup:', error);
            await interaction.editReply({
                content: 'Failed to create backup. Please try again.',
                ephemeral: true
            });
        }
    },

    async listBackups(interaction) {
        try {
            const backupDir = path.join(__dirname, '../../backups');
            
            if (!fs.existsSync(backupDir)) {
                return await interaction.reply({
                    content: 'No backups found.',
                    ephemeral: true
                });
            }

            const files = fs.readdirSync(backupDir)
                .filter(file => file.endsWith('.json') && file.startsWith(interaction.guild.id))
                .map(file => {
                    const filepath = path.join(backupDir, file);
                    const stats = fs.statSync(filepath);
                    return {
                        name: file,
                        created: stats.mtime,
                        size: stats.size
                    };
                })
                .sort((a, b) => b.created - a.created);

            if (files.length === 0) {
                return await interaction.reply({
                    content: 'No backups found for this server.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#4A90E2')
                .setTitle('📁 Server Backups')
                .setDescription(`Found ${files.length} backup(s) for this server`)
                .setTimestamp();

            files.slice(0, 10).forEach(file => {
                embed.addFields({
                    name: file.name,
                    value: `Created: <t:${Math.floor(file.created.getTime() / 1000)}:R>\nSize: ${Math.round(file.size / 1024)}KB`,
                    inline: true
                });
            });

            if (files.length > 10) {
                embed.setFooter({ text: `Showing 10 of ${files.length} backups` });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            logger.error('Error listing backups:', error);
            await interaction.reply({
                content: 'Failed to list backups.',
                ephemeral: true
            });
        }
    }
};