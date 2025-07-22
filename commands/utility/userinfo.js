const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`👤 ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '🆔 User Info',
                    value: `**ID:** ${user.id}\n**Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n**Bot:** ${user.bot ? 'Yes' : 'No'}`,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        if (member) {
            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .slice(0, 20); // Limit to 20 roles to avoid embed limits

            embed.addFields(
                {
                    name: '👥 Member Info',
                    value: `**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n**Nickname:** ${member.nickname || 'None'}\n**Highest Role:** ${member.roles.highest}`,
                    inline: true
                },
                {
                    name: '🎭 Roles',
                    value: roles.length > 0 ? (roles.length > 20 ? `${roles.join(' ')}\n+${member.roles.cache.size - 21} more` : roles.join(' ')) : 'No roles',
                    inline: false
                }
            );

            // Add permissions info if user has notable permissions
            const notablePerms = [];
            if (member.permissions.has('Administrator')) notablePerms.push('Administrator');
            if (member.permissions.has('ManageGuild')) notablePerms.push('Manage Server');
            if (member.permissions.has('ManageRoles')) notablePerms.push('Manage Roles');
            if (member.permissions.has('ManageChannels')) notablePerms.push('Manage Channels');
            if (member.permissions.has('BanMembers')) notablePerms.push('Ban Members');
            if (member.permissions.has('KickMembers')) notablePerms.push('Kick Members');

            if (notablePerms.length > 0) {
                embed.addFields({
                    name: '🛡️ Key Permissions',
                    value: notablePerms.join(', '),
                    inline: true
                });
            }

            // Set color based on user's highest role
            if (member.roles.highest.color !== 0) {
                embed.setColor(member.roles.highest.color);
            }
        }

        // Add avatar field if user has a custom avatar
        if (user.avatar) {
            embed.setImage(user.displayAvatarURL({ dynamic: true, size: 512 }));
        }

        await interaction.reply({ embeds: [embed] });
    }
};