const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        try {
            logger.info(`✅ Bot is online! Logged in as ${client.user.tag}`);
            logger.info(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);

            // Set bot activity status
            const activities = [
                { name: 'for rule breakers', type: ActivityType.Watching },
                { name: 'the server', type: ActivityType.Watching },
                { name: '/help for commands', type: ActivityType.Listening },
                { name: 'with moderation tools', type: ActivityType.Playing }
            ];

            let activityIndex = 0;

            // Set initial activity
            client.user.setActivity(activities[0]);

            // Rotate activities every 30 minutes
            setInterval(() => {
                activityIndex = (activityIndex + 1) % activities.length;
                client.user.setActivity(activities[activityIndex]);
            }, 30 * 60 * 1000);

            // Log some basic bot statistics
            logger.info(`🔧 Commands loaded: ${client.commands.size}`);
            
            // List all guilds the bot is in
            client.guilds.cache.forEach(guild => {
                logger.info(`📍 Connected to guild: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
            });

            // Set bot status to online
            client.user.setStatus('online');

        } catch (error) {
            logger.error('Error in ready event:', error);
        }
    }
};
