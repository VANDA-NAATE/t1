const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create and manage giveaways')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('What are you giving away?')
                        .setRequired(true)
                        .setMaxLength(256))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Duration in minutes')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10080)) // Max 1 week
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners (default: 1)')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('requirements')
                        .setDescription('Entry requirements (optional)')
                        .setMaxLength(500)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID of the giveaway to end')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'start') {
                await this.startGiveaway(interaction);
            } else if (subcommand === 'end') {
                await this.endGiveaway(interaction);
            }

        } catch (error) {
            logger.error('Error executing giveaway command:', error);
            await interaction.reply({
                content: 'An error occurred while managing the giveaway.',
                ephemeral: true
            });
        }
    },

    async startGiveaway(interaction) {
        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getInteger('duration');
        const winners = interaction.options.getInteger('winners') || 1;
        const requirements = interaction.options.getString('requirements');

        const endTime = new Date(Date.now() + duration * 60 * 1000);
        const giveawayId = `giveaway_${Date.now()}`;

        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Host:** ${interaction.user}\n**Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R>`)
            .addFields({
                name: 'How to Enter',
                value: `Click the 🎉 button below to enter!\n**Entries:** 0`,
                inline: false
            })
            .setTimestamp(endTime)
            .setFooter({
                text: `Ends at`,
                iconURL: interaction.client.user.displayAvatarURL()
            });

        if (requirements) {
            embed.addFields({
                name: 'Requirements',
                value: requirements,
                inline: false
            });
        }

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_enter_${giveawayId}`)
                    .setLabel('Enter Giveaway')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Success)
            );

        const response = await interaction.reply({
            embeds: [embed],
            components: [button],
            content: `🎉 **GIVEAWAY** 🎉`
        });

        // Store giveaway data
        const giveawayData = {
            id: giveawayId,
            prize,
            winners,
            requirements,
            host: interaction.user.id,
            endTime: endTime.getTime(),
            participants: new Set(),
            messageId: response.id,
            channelId: interaction.channel.id,
            ended: false
        };

        // Handle entries
        const collector = response.createMessageComponentCollector({
            time: duration * 60 * 1000
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.customId === `giveaway_enter_${giveawayId}`) {
                const userId = buttonInteraction.user.id;

                if (giveawayData.participants.has(userId)) {
                    await buttonInteraction.reply({
                        content: 'You are already entered in this giveaway!',
                        ephemeral: true
                    });
                    return;
                }

                giveawayData.participants.add(userId);

                // Update embed with new entry count
                const updatedEmbed = EmbedBuilder.from(embed)
                    .setFields([
                        {
                            name: 'How to Enter',
                            value: `Click the 🎉 button below to enter!\n**Entries:** ${giveawayData.participants.size}`,
                            inline: false
                        }
                    ]);

                if (requirements) {
                    updatedEmbed.addFields({
                        name: 'Requirements',
                        value: requirements,
                        inline: false
                    });
                }

                await buttonInteraction.update({
                    embeds: [updatedEmbed],
                    components: [button]
                });

                logger.info(`${buttonInteraction.user.tag} entered giveaway: ${prize}`);
            }
        });

        collector.on('end', async () => {
            if (!giveawayData.ended) {
                await this.finishGiveaway(giveawayData, interaction.client);
            }
        });

        // Store reference for manual ending (in a real app, use database)
        global.activeGiveaways = global.activeGiveaways || new Map();
        global.activeGiveaways.set(response.id, giveawayData);

        logger.info(`Giveaway started by ${interaction.user.tag}: ${prize}`);
    },

    async endGiveaway(interaction) {
        const messageId = interaction.options.getString('message_id');
        
        if (!global.activeGiveaways || !global.activeGiveaways.has(messageId)) {
            return await interaction.reply({
                content: 'Giveaway not found or already ended.',
                ephemeral: true
            });
        }

        const giveawayData = global.activeGiveaways.get(messageId);
        
        if (giveawayData.host !== interaction.user.id) {
            return await interaction.reply({
                content: 'You can only end giveaways that you created.',
                ephemeral: true
            });
        }

        giveawayData.ended = true;
        await this.finishGiveaway(giveawayData, interaction.client);
        
        await interaction.reply({
            content: 'Giveaway ended successfully!',
            ephemeral: true
        });
    },

    async finishGiveaway(giveawayData, client) {
        try {
            const channel = await client.channels.fetch(giveawayData.channelId);
            const message = await channel.messages.fetch(giveawayData.messageId);

            const participants = Array.from(giveawayData.participants);
            
            if (participants.length === 0) {
                const noWinnerEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🎉 Giveaway Ended')
                    .setDescription(`**Prize:** ${giveawayData.prize}\n**Winners:** No one entered the giveaway`)
                    .setTimestamp();

                await message.edit({
                    embeds: [noWinnerEmbed],
                    components: []
                });

                return;
            }

            // Select random winners
            const winnerCount = Math.min(giveawayData.winners, participants.length);
            const winners = [];
            const shuffled = [...participants].sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < winnerCount; i++) {
                winners.push(shuffled[i]);
            }

            // Create winner embed
            const winnerEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 Giveaway Ended!')
                .setDescription(`**Prize:** ${giveawayData.prize}`)
                .addFields(
                    {
                        name: 'Winners',
                        value: winners.map(id => `<@${id}>`).join('\n'),
                        inline: true
                    },
                    {
                        name: 'Total Entries',
                        value: participants.length.toString(),
                        inline: true
                    }
                )
                .setTimestamp();

            await message.edit({
                embeds: [winnerEmbed],
                components: []
            });

            // Congratulate winners
            await channel.send({
                content: `🎉 Congratulations to the winner${winners.length > 1 ? 's' : ''}!\n${winners.map(id => `<@${id}>`).join(' ')}\n\nYou won: **${giveawayData.prize}**!`
            });

            // Clean up
            if (global.activeGiveaways) {
                global.activeGiveaways.delete(giveawayData.messageId);
            }

            logger.info(`Giveaway ended: ${giveawayData.prize} - Winners: ${winners.length}`);

        } catch (error) {
            logger.error('Error finishing giveaway:', error);
        }
    }
};