const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display information about available commands'),

    async execute(interaction) {
        // Create main help embed
        const mainEmbed = new EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('🤖 MrToxic Bot - Command Help')
            .setDescription('Select a category from the dropdown menu below to view commands.')
            .addFields(
                { name: '🔨 Moderation', value: 'Commands for server moderation', inline: true },
                { name: '🔧 Utility', value: 'General utility commands', inline: true },
                { name: '🎨 Embed', value: 'Create custom embed messages', inline: true }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        // Create dropdown menu for categories
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Choose a command category')
            .addOptions([
                {
                    label: 'Moderation Commands',
                    description: 'Mute, kick, ban and other moderation tools',
                    value: 'moderation',
                    emoji: '🔨'
                },
                {
                    label: 'Utility Commands',
                    description: 'Ping, serverinfo, and other utilities',
                    value: 'utility',
                    emoji: '🔧'
                },
                {
                    label: 'Embed Commands',
                    description: 'Create and send custom embeds',
                    value: 'embed',
                    emoji: '🎨'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            ephemeral: true
        });

        // Handle select menu interactions
        const collectorFilter = i => i.customId === 'help_category' && i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({
            filter: collectorFilter,
            time: 60000
        });

        collector.on('collect', async i => {
            let embed;
            
            switch (i.values[0]) {
                case 'moderation':
                    embed = new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('🔨 Moderation Commands')
                        .addFields(
                            {
                                name: '/mute <user> <duration> [reason]',
                                value: 'Timeout a user for a specified duration\n**Example:** `/mute @user 10m Spamming`',
                                inline: false
                            },
                            {
                                name: '/kick <user> [reason]',
                                value: 'Kick a user from the server\n**Example:** `/kick @user Breaking rules`',
                                inline: false
                            },
                            {
                                name: '/ban <user> [reason] [delete_days]',
                                value: 'Ban a user from the server\n**Example:** `/ban @user Serious violation 7`',
                                inline: false
                            }
                        )
                        .setFooter({ text: 'Requires appropriate permissions' });
                    break;
                
                case 'utility':
                    embed = new EmbedBuilder()
                        .setColor('#4A90E2')
                        .setTitle('🔧 Utility Commands')
                        .addFields(
                            {
                                name: '/ping',
                                value: 'Check bot response time and API latency',
                                inline: false
                            },
                            {
                                name: '/say <message>',
                                value: 'Make the bot repeat your message\n**Example:** `/say Hello everyone!`',
                                inline: false
                            },
                            {
                                name: '/serverinfo',
                                value: 'Display information about the current server',
                                inline: false
                            },
                            {
                                name: '/help',
                                value: 'Display this help message',
                                inline: false
                            }
                        );
                    break;
                
                case 'embed':
                    embed = new EmbedBuilder()
                        .setColor('#9B59B6')
                        .setTitle('🎨 Embed Commands')
                        .addFields(
                            {
                                name: '/embed',
                                value: 'Create and send custom embedded messages with various options:\n' +
                                       '• **title** - Embed title\n' +
                                       '• **description** - Main content\n' +
                                       '• **color** - Hex color code\n' +
                                       '• **image** - Image URL\n' +
                                       '• **thumbnail** - Thumbnail URL\n' +
                                       '• **footer** - Footer text',
                                inline: false
                            }
                        )
                        .setFooter({ text: 'Requires Manage Messages permission' });
                    break;
            }

            await i.update({ embeds: [embed] });
        });

        collector.on('end', async () => {
            try {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                    );
                await response.edit({ components: [disabledRow] });
            } catch (error) {
                // Interaction may have been deleted
            }
        });
    }
};
