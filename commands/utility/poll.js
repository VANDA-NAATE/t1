const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with multiple options')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true)
                .setMaxLength(256))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('First option')
                .setRequired(true)
                .setMaxLength(80))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Second option')
                .setRequired(true)
                .setMaxLength(80))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (default: 60, max: 1440)')
                .setMinValue(1)
                .setMaxValue(1440)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Third option')
                .setRequired(false)
                .setMaxLength(80))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Fourth option')
                .setRequired(false)
                .setMaxLength(80))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Fifth option')
                .setRequired(false)
                .setMaxLength(80)),

    async execute(interaction) {
        try {
            const question = interaction.options.getString('question');
            const duration = interaction.options.getInteger('duration') || 60;
            
            // Collect all options
            const options = [];
            for (let i = 1; i <= 5; i++) {
                const option = interaction.options.getString(`option${i}`);
                if (option) options.push(option);
            }

            // Create poll data
            const pollId = `poll_${Date.now()}`;
            const votes = {};
            options.forEach((_, index) => {
                votes[index] = new Set();
            });

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#4A90E2')
                .setTitle('📊 Poll')
                .setDescription(question)
                .addFields({
                    name: 'Options',
                    value: options.map((option, index) => `${index + 1}️⃣ ${option}`).join('\n'),
                    inline: false
                })
                .setFooter({
                    text: `Poll ends in ${duration} minutes | 0 total votes`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Create buttons
            const buttons = [];
            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            
            for (let i = 0; i < options.length; i++) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`poll_vote_${pollId}_${i}`)
                        .setLabel(`Option ${i + 1}`)
                        .setEmoji(emojis[i])
                        .setStyle(ButtonStyle.Primary)
                );
            }

            // Add end poll button for poll creator
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`poll_end_${pollId}`)
                    .setLabel('End Poll')
                    .setEmoji('🛑')
                    .setStyle(ButtonStyle.Danger)
            );

            const rows = [];
            for (let i = 0; i < buttons.length; i += 5) {
                rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            }

            const response = await interaction.reply({
                embeds: [embed],
                components: rows
            });

            // Store poll data (in a real application, you'd use a database)
            const pollData = {
                id: pollId,
                question,
                options,
                votes,
                creator: interaction.user.id,
                endTime: Date.now() + (duration * 60 * 1000),
                messageId: response.id,
                channelId: interaction.channel.id
            };

            // Handle button interactions
            const collector = response.createMessageComponentCollector({
                time: duration * 60 * 1000
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId.startsWith(`poll_vote_${pollId}`)) {
                    const optionIndex = parseInt(buttonInteraction.customId.split('_').pop());
                    const userId = buttonInteraction.user.id;

                    // Remove user from all options first (single vote only)
                    Object.values(pollData.votes).forEach(voteSet => voteSet.delete(userId));
                    
                    // Add vote to selected option
                    pollData.votes[optionIndex].add(userId);

                    // Update embed
                    const totalVotes = Object.values(pollData.votes).reduce((sum, set) => sum + set.size, 0);
                    const updatedEmbed = EmbedBuilder.from(embed)
                        .setFields([
                            {
                                name: 'Results',
                                value: options.map((option, index) => {
                                    const voteCount = pollData.votes[index].size;
                                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                    const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
                                    return `${index + 1}️⃣ **${option}**\n\`${bar}\` ${voteCount} votes (${percentage}%)`;
                                }).join('\n\n'),
                                inline: false
                            }
                        ])
                        .setFooter({
                            text: `Poll ends in ${Math.ceil((pollData.endTime - Date.now()) / 60000)} minutes | ${totalVotes} total votes`,
                            iconURL: interaction.user.displayAvatarURL()
                        });

                    await buttonInteraction.update({
                        embeds: [updatedEmbed],
                        components: rows
                    });

                } else if (buttonInteraction.customId === `poll_end_${pollId}`) {
                    if (buttonInteraction.user.id !== pollData.creator) {
                        return await buttonInteraction.reply({
                            content: 'Only the poll creator can end this poll.',
                            ephemeral: true
                        });
                    }

                    collector.stop('ended_by_creator');
                }
            });

            collector.on('end', async (collected, reason) => {
                // Final results
                const totalVotes = Object.values(pollData.votes).reduce((sum, set) => sum + set.size, 0);
                const finalEmbed = EmbedBuilder.from(embed)
                    .setColor('#FF6B6B')
                    .setTitle('📊 Poll Ended')
                    .setFields([
                        {
                            name: 'Final Results',
                            value: totalVotes > 0 ? options.map((option, index) => {
                                const voteCount = pollData.votes[index].size;
                                const percentage = Math.round((voteCount / totalVotes) * 100);
                                const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
                                return `${index + 1}️⃣ **${option}**\n\`${bar}\` ${voteCount} votes (${percentage}%)`;
                            }).join('\n\n') : 'No votes were cast.',
                            inline: false
                        }
                    ])
                    .setFooter({
                        text: `Poll ended ${reason === 'ended_by_creator' ? 'by creator' : 'automatically'} | ${totalVotes} total votes`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                try {
                    await response.edit({
                        embeds: [finalEmbed],
                        components: [] // Remove all buttons
                    });
                } catch (error) {
                    logger.warn('Could not update poll message after ending:', error.message);
                }
            });

            logger.info(`Poll created by ${interaction.user.tag}: "${question}"`);

        } catch (error) {
            logger.error('Error executing poll command:', error);
            await interaction.reply({
                content: 'An error occurred while creating the poll.',
                ephemeral: true
            });
        }
    }
};