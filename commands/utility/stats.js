const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Display detailed server statistics and analytics')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period for statistics')
                .addChoices(
                    { name: 'Today', value: 'today' },
                    { name: 'This Week', value: 'week' },
                    { name: 'This Month', value: 'month' },
                    { name: 'All Time', value: 'all' }
                )
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guild = interaction.guild;
            const period = interaction.options.getString('period') || 'all';
            
            // Calculate time ranges
            const now = new Date();
            let startDate = new Date(0); // All time default
            
            switch (period) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }

            // Fetch all members
            await guild.members.fetch();
            const members = guild.members.cache;

            // Basic member statistics
            const totalMembers = members.size;
            const humans = members.filter(m => !m.user.bot).size;
            const bots = members.filter(m => m.user.bot).size;
            const onlineMembers = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;

            // Role statistics
            const roles = guild.roles.cache.filter(r => r.id !== guild.id); // Exclude @everyone
            const assignedRoles = roles.filter(r => r.members.size > 0);

            // Channel statistics
            const channels = guild.channels.cache;
            const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
            const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
            const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
            const threads = channels.filter(c => c.isThread()).size;

            // Member join statistics for the period
            let newMembers = 0;
            if (period !== 'all') {
                newMembers = members.filter(m => m.joinedAt && m.joinedAt >= startDate).size;
            }

            // Activity analysis
            const membersByJoinDate = members.filter(m => m.joinedAt)
                .sort((a, b) => b.joinedAt - a.joinedAt)
                .first(10);

            // Most common roles
            const roleStats = roles.sort((a, b) => b.members.size - a.members.size)
                .first(5)
                .map(role => `${role.name}: ${role.members.size} members`);

            // Create main stats embed
            const embed = new EmbedBuilder()
                .setColor('#4A90E2')
                .setTitle(`📊 Server Statistics - ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    {
                        name: '👥 Member Overview',
                        value: `**Total:** ${totalMembers}\n**Humans:** ${humans}\n**Bots:** ${bots}\n**Online:** ${onlineMembers}`,
                        inline: true
                    },
                    {
                        name: '📢 Channels',
                        value: `**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}\n**Threads:** ${threads}`,
                        inline: true
                    },
                    {
                        name: '🎭 Roles',
                        value: `**Total:** ${roles.size}\n**With Members:** ${assignedRoles.size}\n**Empty:** ${roles.size - assignedRoles.size}`,
                        inline: true
                    }
                );

            // Add period-specific stats
            if (period !== 'all') {
                const periodName = period.charAt(0).toUpperCase() + period.slice(1);
                embed.addFields({
                    name: `📈 ${periodName} Growth`,
                    value: `**New Members:** ${newMembers}`,
                    inline: true
                });
            }

            // Add server info
            embed.addFields(
                {
                    name: '📅 Server Created',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: '👑 Owner',
                    value: `<@${guild.ownerId}>`,
                    inline: true
                },
                {
                    name: '🛡️ Verification Level',
                    value: ['None', 'Low', 'Medium', 'High', 'Very High'][guild.verificationLevel],
                    inline: true
                }
            );

            // Add top roles if any exist
            if (roleStats.length > 0) {
                embed.addFields({
                    name: '🏆 Most Popular Roles',
                    value: roleStats.join('\n'),
                    inline: false
                });
            }

            // Add server features if any
            if (guild.features.length > 0) {
                const features = guild.features.map(f => 
                    f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                ).slice(0, 10).join(', ');
                
                embed.addFields({
                    name: '✨ Server Features',
                    value: features.length > 1024 ? features.substring(0, 1021) + '...' : features,
                    inline: false
                });
            }

            // Add boost info if applicable
            if (guild.premiumSubscriptionCount > 0) {
                embed.addFields({
                    name: '💎 Server Boosts',
                    value: `**Level:** ${guild.premiumTier}\n**Boosts:** ${guild.premiumSubscriptionCount}`,
                    inline: true
                });
            }

            embed.setTimestamp()
                .setFooter({
                    text: `Period: ${period === 'all' ? 'All Time' : period} | Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.editReply({ embeds: [embed] });

            logger.info(`Server stats requested by ${interaction.user.tag} for period: ${period}`);

        } catch (error) {
            logger.error('Error executing stats command:', error);
            await interaction.editReply({
                content: 'An error occurred while gathering server statistics.',
            });
        }
    }
};