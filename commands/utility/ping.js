const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s response time and API latency'),

    async execute(interaction) {
        // Measure response time
        const sent = await interaction.reply({
            content: '🏓 Pinging...',
            fetchReply: true
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('🏓 Pong!')
            .addFields(
                {
                    name: 'Bot Latency',
                    value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`,
                    inline: true
                },
                {
                    name: 'API Latency',
                    value: `${Math.round(interaction.client.ws.ping)}ms`,
                    inline: true
                },
                {
                    name: 'Status',
                    value: interaction.client.ws.ping < 100 ? '🟢 Excellent' :
                           interaction.client.ws.ping < 200 ? '🟡 Good' :
                           interaction.client.ws.ping < 300 ? '🟠 Fair' : '🔴 Poor',
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await interaction.editReply({
            content: '',
            embeds: [embed]
        });
    }
};
