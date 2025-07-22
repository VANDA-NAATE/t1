const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the current server'),

    async execute(interaction) {
        const guild = interaction.guild;

        // Fetch additional guild information
        await guild.members.fetch();
        const channels = guild.channels.cache;
        const roles = guild.roles.cache;

        // Count different types of channels
        const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;

        // Count members by status
        const members = guild.members.cache;
        const onlineMembers = members.filter(m => m.presence?.status === 'online').size;
        const bots = members.filter(m => m.user.bot).size;
        const humans = members.size - bots;

        // Verification level mapping
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };

        // Server features
        const features = guild.features.length > 0 
            ? guild.features.map(feature => feature.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(', ')
            : 'None';

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📊 ${guild.name} Server Information`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '🆔 Server Details',
                    value: `**ID:** ${guild.id}\n**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n**Owner:** <@${guild.ownerId}>`,
                    inline: true
                },
                {
                    name: '👥 Members',
                    value: `**Total:** ${guild.memberCount}\n**Humans:** ${humans}\n**Bots:** ${bots}\n**Online:** ${onlineMembers}`,
                    inline: true
                },
                {
                    name: '📢 Channels',
                    value: `**Total:** ${channels.size}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}`,
                    inline: true
                },
                {
                    name: '🎭 Roles',
                    value: `**Total:** ${roles.size - 1}\n**Highest:** ${guild.roles.highest}`,
                    inline: true
                },
                {
                    name: '🛡️ Security',
                    value: `**Verification:** ${verificationLevels[guild.verificationLevel]}\n**2FA Required:** ${guild.mfaLevel ? 'Yes' : 'No'}`,
                    inline: true
                },
                {
                    name: '✨ Features',
                    value: features.length > 1024 ? features.substring(0, 1021) + '...' : features,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        // Add server banner if available
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
        }

        // Add boost information if server has boosts
        if (guild.premiumSubscriptionCount > 0) {
            embed.addFields({
                name: '💎 Nitro Boosts',
                value: `**Level:** ${guild.premiumTier}\n**Boosts:** ${guild.premiumSubscriptionCount}`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
