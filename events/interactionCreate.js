const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.warn(`No command matching ${interaction.commandName} was found.`);
                return await interaction.reply({
                    content: 'This command is not available.',
                    ephemeral: true
                });
            }

            try {
                // Log command usage
                logger.info(`Command ${interaction.commandName} executed by ${interaction.user.tag} (${interaction.user.id}) in guild ${interaction.guild?.name || 'DM'}`);

                // Execute the command
                await command.execute(interaction);

            } catch (error) {
                logger.error(`Error executing command ${interaction.commandName}:`, error);

                const errorMessage = {
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                };

                // Try to reply or followUp depending on interaction state
                if (interaction.replied || interaction.deferred) {
                    try {
                        await interaction.followUp(errorMessage);
                    } catch (followUpError) {
                        logger.error('Failed to send follow-up error message:', followUpError);
                    }
                } else {
                    try {
                        await interaction.reply(errorMessage);
                    } catch (replyError) {
                        logger.error('Failed to send error reply:', replyError);
                    }
                }
            }
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            logger.info(`Button ${interaction.customId} clicked by ${interaction.user.tag}`);
            // Add button handler logic here if needed
        }
        
        // Handle select menu interactions
        else if (interaction.isStringSelectMenu()) {
            logger.info(`Select menu ${interaction.customId} used by ${interaction.user.tag} with values: ${interaction.values.join(', ')}`);
            // Add select menu handler logic here if needed
        }
        
        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            logger.info(`Modal ${interaction.customId} submitted by ${interaction.user.tag}`);
            // Add modal handler logic here if needed
        }

        // Handle autocomplete interactions
        else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command || !command.autocomplete) {
                logger.warn(`No autocomplete handler found for command ${interaction.commandName}`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error(`Error in autocomplete for ${interaction.commandName}:`, error);
            }
        }
    }
};
