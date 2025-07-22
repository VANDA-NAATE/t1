const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

// Initialize Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// Create collections for commands
client.commands = new Collection();

// Load commands dynamically from all subdirectories
const loadCommands = () => {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                logger.info(`Loaded command: ${command.data.name}`);
            } else {
                logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
            }
        }
    }
};

// Load events dynamically
const loadEvents = () => {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        logger.info(`Loaded event: ${event.name}`);
    }
};

// Load automated systems
const loadSystems = () => {
    const systemsPath = path.join(__dirname, 'systems');
    const systemFiles = fs.readdirSync(systemsPath).filter(file => file.endsWith('.js'));

    for (const file of systemFiles) {
        const filePath = path.join(systemsPath, file);
        const system = require(filePath);
        
        if (typeof system.init === 'function') {
            system.init(client);
            logger.info(`Initialized system: ${file}`);
        }
    }
};

// Register slash commands with Discord API
const registerCommands = async () => {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('data' in command) {
                commands.push(command.data.toJSON());
            }
        }
    }

    const rest = new REST().setToken(process.env.TOKEN);

    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        let registrationSuccess = false;

        // Try guild-specific registration first if GUILD_ID is provided
        if (process.env.GUILD_ID) {
            try {
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                    { body: commands },
                );
                logger.info(`Successfully reloaded ${data.length} guild-specific application (/) commands.`);
                registrationSuccess = true;
            } catch (guildError) {
                logger.warn('Failed to register guild commands, trying global registration:', guildError.message);
                
                // If guild registration fails, try global registration
                try {
                    const data = await rest.put(
                        Routes.applicationCommands(process.env.CLIENT_ID),
                        { body: commands },
                    );
                    logger.info(`Successfully reloaded ${data.length} global application (/) commands.`);
                    logger.info('Note: Global commands may take up to 1 hour to appear in all servers.');
                    registrationSuccess = true;
                } catch (globalError) {
                    logger.error('Failed to register both guild and global commands:', globalError.message);
                }
            }
        } else {
            // No GUILD_ID provided, register globally
            try {
                const data = await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: commands },
                );
                logger.info(`Successfully reloaded ${data.length} global application (/) commands.`);
                logger.info('Note: Global commands may take up to 1 hour to appear in all servers.');
                registrationSuccess = true;
            } catch (globalError) {
                logger.error('Failed to register global commands:', globalError.message);
            }
        }

        if (!registrationSuccess) {
            logger.error('Command registration failed. The bot will still connect but commands may not be available.');
            logger.info('Make sure the bot is properly invited to your server with the applications.commands scope.');
        }

    } catch (error) {
        logger.error('Unexpected error during command registration:', error);
    }
};

// Initialize bot
const init = async () => {
    try {
        logger.info('Starting MrToxic Discord Bot...');
        
        // Load all components
        loadCommands();
        loadEvents();
        
        // Login to Discord first
        await client.login(process.env.TOKEN);
        
        // Load systems after successful login
        loadSystems();
        
        // Register commands after bot is online (may fail, but bot will still work)
        await registerCommands();
        
    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// Start the bot
init();

module.exports = client;
