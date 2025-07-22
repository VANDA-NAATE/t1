const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Advanced server management tools')
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription('Get a comprehensive server management overview'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription('View server activity and health metrics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Bulk role management operations')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .addChoices(
                            { name: 'Clean Empty Roles', value: 'clean_empty' },
                            { name: 'List Role Members', value: 'list_members' },
                            { name: 'Role Statistics', value: 'statistics' }
                        )
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Channel management operations')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .addChoices(
                            { name: 'Inactive Channels', value: 'inactive' },
                            { name: 'Channel Statistics', value: 'statistics' },
                            { name: 'Sync Permissions', value: 'sync_perms' }
                        )
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'overview':
                    await this.serverOverview(interaction);
                    break;
                case 'activity':
                    await this.serverActivity(interaction);
                    break;
                case 'roles':
                    await this.roleManagement(interaction);
                    break;
                case 'channels':
                    await this.channelManagement(interaction);
                    break;
            }

        } catch (error) {
            logger.error('Error executing manage command:', error);
            await interaction.reply({
                content: 'An error occurred during server management.',
                ephemeral: true
            });
        }
    },

    async serverOverview(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        await guild.members.fetch();

        // Calculate various metrics
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

        const recentJoins = guild.members.cache.filter(m => m.joinedAt && m.joinedAt.getTime() > dayAgo).size;
        const weekJoins = guild.members.cache.filter(m => m.joinedAt && m.joinedAt.getTime() > weekAgo).size;

        // Role distribution
        const roleStats = guild.roles.cache
            .filter(r => r.id !== guild.id && r.members.size > 0)
            .sort((a, b) => b.members.size - a.members.size)
            .first(5);

        // Channel activity (approximation based on last message)
        const activeChannels = guild.channels.cache
            .filter(c => c.lastMessageId)
            .size;

        // Security metrics
        const adminRoles = guild.roles.cache.filter(r => r.permissions.has('Administrator')).size;
        const modRoles = guild.roles.cache.filter(r => 
            r.permissions.has('ManageMessages') || 
            r.permissions.has('KickMembers') || 
            r.permissions.has('BanMembers')
        ).size;

        const embed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle(`🏛️ Server Management Overview - ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '👥 Member Activity',
                    value: `**Total:** ${guild.memberCount}\n**Joined Today:** ${recentJoins}\n**Joined This Week:** ${weekJoins}`,
                    inline: true
                },
                {
                    name: '📊 Server Health',
                    value: `**Active Channels:** ${activeChannels}\n**Verification:** ${['None', 'Low', 'Medium', 'High', 'Very High'][guild.verificationLevel]}\n**Boost Level:** ${guild.premiumTier}`,
                    inline: true
                },
                {
                    name: '🛡️ Security Overview',
                    value: `**Admin Roles:** ${adminRoles}\n**Mod Roles:** ${modRoles}\n**2FA Required:** ${guild.mfaLevel === 1 ? 'Yes' : 'No'}`,
                    inline: true
                },
                {
                    name: '🎭 Top Roles by Members',
                    value: roleStats.length > 0 ? 
                        roleStats.map(r => `${r.name}: ${r.members.size}`).join('\n') : 
                        'No roles with members',
                    inline: false
                }
            );

        if (guild.features.length > 0) {
            embed.addFields({
                name: '✨ Server Features',
                value: guild.features.slice(0, 10).map(f => 
                    f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                ).join(', '),
                inline: false
            });
        }

        embed.setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await interaction.editReply({ embeds: [embed] });
    },

    async serverActivity(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;

        // Fetch recent audit logs
        let auditActions = [];
        try {
            const auditLogs = await guild.fetchAuditLogs({ limit: 20 });
            auditActions = auditLogs.entries
                .filter(entry => entry.createdTimestamp > dayAgo)
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                .first(10);
        } catch (error) {
            logger.warn('Could not fetch audit logs:', error.message);
        }

        // Online status distribution
        await guild.members.fetch();
        const statusCounts = {
            online: 0,
            idle: 0,
            dnd: 0,
            offline: 0
        };

        guild.members.cache.forEach(member => {
            const status = member.presence?.status || 'offline';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const embed = new EmbedBuilder()
            .setColor('#00D166')
            .setTitle('📈 Server Activity Report')
            .addFields(
                {
                    name: '🟢 Member Status',
                    value: `**Online:** ${statusCounts.online}\n**Idle:** ${statusCounts.idle}\n**DND:** ${statusCounts.dnd}\n**Offline:** ${statusCounts.offline}`,
                    inline: true
                },
                {
                    name: '📊 Activity Level',
                    value: `**Health Score:** ${this.calculateHealthScore(guild, statusCounts)}/10\n**Activity:** ${this.getActivityLevel(statusCounts)}`,
                    inline: true
                }
            );

        if (auditActions.length > 0) {
            const recentActions = auditActions.map(entry => {
                const timeStr = `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>`;
                return `${this.getActionEmoji(entry.action)} ${entry.action} ${timeStr}`;
            }).join('\n');

            embed.addFields({
                name: '📋 Recent Admin Actions (24h)',
                value: recentActions.length > 1024 ? recentActions.substring(0, 1021) + '...' : recentActions,
                inline: false
            });
        } else {
            embed.addFields({
                name: '📋 Recent Admin Actions (24h)',
                value: 'No recent admin actions or insufficient permissions to view audit log',
                inline: false
            });
        }

        embed.setTimestamp()
            .setFooter({
                text: `Generated for ${guild.name}`,
                iconURL: guild.iconURL()
            });

        await interaction.editReply({ embeds: [embed] });
    },

    async roleManagement(interaction) {
        const action = interaction.options.getString('action');
        const guild = interaction.guild;

        await interaction.deferReply();

        switch (action) {
            case 'clean_empty': {
                const emptyRoles = guild.roles.cache.filter(r => 
                    r.id !== guild.id && 
                    r.members.size === 0 && 
                    !r.managed &&
                    r.position < guild.members.me.roles.highest.position
                );

                if (emptyRoles.size === 0) {
                    return await interaction.editReply({
                        content: 'No empty roles found that can be deleted.'
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🧹 Empty Roles Found')
                    .setDescription(`Found ${emptyRoles.size} empty role(s) that can be cleaned up:`)
                    .addFields({
                        name: 'Empty Roles',
                        value: emptyRoles.map(r => r.name).slice(0, 20).join('\n'),
                        inline: false
                    });

                if (emptyRoles.size > 20) {
                    embed.setFooter({ text: `And ${emptyRoles.size - 20} more...` });
                }

                await interaction.editReply({ embeds: [embed] });
                break;
            }

            case 'statistics': {
                const roles = guild.roles.cache.filter(r => r.id !== guild.id);
                const managedRoles = roles.filter(r => r.managed);
                const customRoles = roles.filter(r => !r.managed);
                const emptyRoles = roles.filter(r => r.members.size === 0);

                const embed = new EmbedBuilder()
                    .setColor('#4A90E2')
                    .setTitle('🎭 Role Statistics')
                    .addFields(
                        { name: 'Total Roles', value: roles.size.toString(), inline: true },
                        { name: 'Custom Roles', value: customRoles.size.toString(), inline: true },
                        { name: 'Managed Roles', value: managedRoles.size.toString(), inline: true },
                        { name: 'Empty Roles', value: emptyRoles.size.toString(), inline: true },
                        { name: 'Roles with Members', value: (roles.size - emptyRoles.size).toString(), inline: true },
                        { name: 'Average Members/Role', value: Math.round(roles.reduce((acc, r) => acc + r.members.size, 0) / roles.size).toString(), inline: true }
                    );

                await interaction.editReply({ embeds: [embed] });
                break;
            }
        }
    },

    async channelManagement(interaction) {
        const action = interaction.options.getString('action');
        const guild = interaction.guild;

        await interaction.deferReply();

        switch (action) {
            case 'statistics': {
                const channels = guild.channels.cache;
                const textChannels = channels.filter(c => c.type === 0);
                const voiceChannels = channels.filter(c => c.type === 2);
                const categories = channels.filter(c => c.type === 4);
                const activeChannels = channels.filter(c => c.lastMessageId).size;

                const embed = new EmbedBuilder()
                    .setColor('#4A90E2')
                    .setTitle('📢 Channel Statistics')
                    .addFields(
                        { name: 'Text Channels', value: textChannels.size.toString(), inline: true },
                        { name: 'Voice Channels', value: voiceChannels.size.toString(), inline: true },
                        { name: 'Categories', value: categories.size.toString(), inline: true },
                        { name: 'Active Channels', value: activeChannels.toString(), inline: true },
                        { name: 'Total Channels', value: channels.size.toString(), inline: true }
                    );

                await interaction.editReply({ embeds: [embed] });
                break;
            }

            case 'inactive': {
                const now = Date.now();
                const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
                
                const inactiveChannels = guild.channels.cache.filter(c => {
                    if (c.type !== 0) return false; // Only text channels
                    if (!c.lastMessage) return true;
                    return c.lastMessage.createdTimestamp < weekAgo;
                });

                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('😴 Inactive Channels (7+ days)')
                    .setDescription(`Found ${inactiveChannels.size} inactive text channels:`)
                    .addFields({
                        name: 'Inactive Channels',
                        value: inactiveChannels.size > 0 ? 
                            inactiveChannels.map(c => `${c.name}`).slice(0, 25).join('\n') :
                            'No inactive channels found',
                        inline: false
                    });

                if (inactiveChannels.size > 25) {
                    embed.setFooter({ text: `And ${inactiveChannels.size - 25} more...` });
                }

                await interaction.editReply({ embeds: [embed] });
                break;
            }
        }
    },

    calculateHealthScore(guild, statusCounts) {
        const total = guild.memberCount;
        const active = statusCounts.online + statusCounts.idle + statusCounts.dnd;
        const activePercent = (active / total) * 100;
        
        if (activePercent >= 50) return 10;
        if (activePercent >= 40) return 8;
        if (activePercent >= 30) return 6;
        if (activePercent >= 20) return 4;
        if (activePercent >= 10) return 2;
        return 1;
    },

    getActivityLevel(statusCounts) {
        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        const active = statusCounts.online + statusCounts.idle;
        const percent = (active / total) * 100;

        if (percent >= 30) return 'Very Active';
        if (percent >= 20) return 'Active';
        if (percent >= 10) return 'Moderate';
        if (percent >= 5) return 'Low';
        return 'Very Low';
    },

    getActionEmoji(action) {
        const emojis = {
            MEMBER_KICK: '👢',
            MEMBER_BAN_ADD: '🔨',
            MEMBER_BAN_REMOVE: '🔓',
            MEMBER_UPDATE: '👤',
            ROLE_CREATE: '🎭',
            ROLE_DELETE: '🗑️',
            CHANNEL_CREATE: '📢',
            CHANNEL_DELETE: '❌',
            MESSAGE_DELETE: '🗑️'
        };
        return emojis[action] || '📋';
    }
};