const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup and configure bot features for your server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('autorole')
                .setDescription('Configure automatic role assignment')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to auto-assign to new members')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('verification')
                .setDescription('Setup verification system')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role given after verification')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('timeout')
                        .setDescription('Minutes before kicking unverified users (default: 10)')
                        .setMinValue(1)
                        .setMaxValue(1440)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Setup welcome/goodbye system')
                .addChannelOption(option =>
                    option.setName('welcome_channel')
                        .setDescription('Channel for welcome messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('goodbye_channel')
                        .setDescription('Channel for goodbye messages (optional)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('logging')
                .setDescription('Setup moderation logging')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for moderation logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current bot configuration'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'autorole':
                    await this.setupAutoRole(interaction);
                    break;
                case 'verification':
                    await this.setupVerification(interaction);
                    break;
                case 'welcome':
                    await this.setupWelcome(interaction);
                    break;
                case 'logging':
                    await this.setupLogging(interaction);
                    break;
                case 'view':
                    await this.viewConfig(interaction);
                    break;
            }

        } catch (error) {
            logger.error('Error executing setup command:', error);
            await interaction.reply({
                content: 'An error occurred during setup.',
                ephemeral: true
            });
        }
    },

    async setupAutoRole(interaction) {
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        // Check if bot can assign this role
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: 'I cannot assign roles higher than or equal to my highest role.',
                ephemeral: true
            });
        }

        // Save to environment or config file
        await this.updateGuildConfig(guildId, { AUTO_ROLE_ID: role.id });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Auto Role Configured')
            .addFields(
                { name: 'Role', value: role.toString(), inline: true },
                { name: 'Members', value: role.members.size.toString(), inline: true },
                { name: 'Status', value: 'Active', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        logger.info(`Auto role configured in ${interaction.guild.name}: ${role.name}`);
    },

    async setupVerification(interaction) {
        const role = interaction.options.getRole('role');
        const timeout = interaction.options.getInteger('timeout') || 10;
        const guildId = interaction.guild.id;

        await this.updateGuildConfig(guildId, { 
            VERIFY_ROLE_ID: role.id,
            VERIFY_TIMEOUT_MINUTES: timeout
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Verification System Configured')
            .addFields(
                { name: 'Verification Role', value: role.toString(), inline: true },
                { name: 'Timeout', value: `${timeout} minutes`, inline: true },
                { name: 'Status', value: 'Active', inline: true }
            )
            .setDescription('New members will be kicked if they don\'t receive the verification role within the timeout period.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        logger.info(`Verification system configured in ${interaction.guild.name}: ${role.name}, ${timeout}min timeout`);
    },

    async setupWelcome(interaction) {
        const welcomeChannel = interaction.options.getChannel('welcome_channel');
        const goodbyeChannel = interaction.options.getChannel('goodbye_channel') || welcomeChannel;
        const guildId = interaction.guild.id;

        // Check if bot can send messages in the channels
        if (!welcomeChannel.permissionsFor(interaction.client.user).has('SendMessages')) {
            return await interaction.reply({
                content: 'I don\'t have permission to send messages in the welcome channel.',
                ephemeral: true
            });
        }

        await this.updateGuildConfig(guildId, { 
            WELCOME_CHANNEL_ID: welcomeChannel.id,
            GOODBYE_CHANNEL_ID: goodbyeChannel.id
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Welcome System Configured')
            .addFields(
                { name: 'Welcome Channel', value: welcomeChannel.toString(), inline: true },
                { name: 'Goodbye Channel', value: goodbyeChannel.toString(), inline: true },
                { name: 'Status', value: 'Active', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Send test welcome message
        const testEmbed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('🎉 Welcome System Test')
            .setDescription('This is a test message to confirm the welcome system is working!')
            .setFooter({ text: 'Setup completed by ' + interaction.user.tag });

        await welcomeChannel.send({ embeds: [testEmbed] });
        
        logger.info(`Welcome system configured in ${interaction.guild.name}: #${welcomeChannel.name}`);
    },

    async setupLogging(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;

        if (!channel.permissionsFor(interaction.client.user).has(['SendMessages', 'EmbedLinks'])) {
            return await interaction.reply({
                content: 'I need permission to send messages and embed links in the logging channel.',
                ephemeral: true
            });
        }

        await this.updateGuildConfig(guildId, { LOGGING_CHANNEL_ID: channel.id });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Moderation Logging Configured')
            .addFields(
                { name: 'Log Channel', value: channel.toString(), inline: true },
                { name: 'Events Logged', value: 'Moderation actions, member joins/leaves, role changes', inline: false },
                { name: 'Status', value: 'Active', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Send test log message
        const logEmbed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('📋 Moderation Log Test')
            .setDescription('This channel will now receive moderation logs.')
            .addFields({
                name: 'Setup by',
                value: interaction.user.tag,
                inline: true
            })
            .setTimestamp();

        await channel.send({ embeds: [logEmbed] });
        
        logger.info(`Logging configured in ${interaction.guild.name}: #${channel.name}`);
    },

    async viewConfig(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.getGuildConfig(guildId);

        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle(`⚙️ Bot Configuration - ${interaction.guild.name}`)
            .setTimestamp();

        const fields = [];

        // Auto Role
        if (config.AUTO_ROLE_ID) {
            const role = interaction.guild.roles.cache.get(config.AUTO_ROLE_ID);
            fields.push({
                name: '🤖 Auto Role',
                value: role ? role.toString() : 'Role not found',
                inline: true
            });
        }

        // Verification
        if (config.VERIFY_ROLE_ID) {
            const role = interaction.guild.roles.cache.get(config.VERIFY_ROLE_ID);
            fields.push({
                name: '✅ Verification',
                value: `Role: ${role ? role.toString() : 'Not found'}\nTimeout: ${config.VERIFY_TIMEOUT_MINUTES || 10} minutes`,
                inline: true
            });
        }

        // Welcome System
        if (config.WELCOME_CHANNEL_ID) {
            const channel = interaction.guild.channels.cache.get(config.WELCOME_CHANNEL_ID);
            fields.push({
                name: '👋 Welcome System',
                value: `Channel: ${channel ? channel.toString() : 'Channel not found'}`,
                inline: true
            });
        }

        // Logging
        if (config.LOGGING_CHANNEL_ID) {
            const channel = interaction.guild.channels.cache.get(config.LOGGING_CHANNEL_ID);
            fields.push({
                name: '📋 Moderation Logs',
                value: channel ? channel.toString() : 'Channel not found',
                inline: true
            });
        }

        if (fields.length === 0) {
            embed.setDescription('No features have been configured yet. Use `/setup` commands to configure bot features.');
        } else {
            embed.addFields(fields);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async updateGuildConfig(guildId, updates) {
        const configDir = path.join(__dirname, '../../data');
        const configFile = path.join(configDir, 'guild_configs.json');

        // Ensure directory exists
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Load existing config
        let configs = {};
        if (fs.existsSync(configFile)) {
            try {
                configs = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            } catch (error) {
                logger.error('Error reading guild config:', error);
            }
        }

        // Update config
        if (!configs[guildId]) configs[guildId] = {};
        Object.assign(configs[guildId], updates);

        // Save config
        try {
            fs.writeFileSync(configFile, JSON.stringify(configs, null, 2));
        } catch (error) {
            logger.error('Error saving guild config:', error);
        }
    },

    async getGuildConfig(guildId) {
        const configFile = path.join(__dirname, '../../data/guild_configs.json');
        
        if (!fs.existsSync(configFile)) return {};

        try {
            const configs = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            return configs[guildId] || {};
        } catch (error) {
            logger.error('Error reading guild config:', error);
            return {};
        }
    }
};