const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'autoRole',
    
    init(client) {
        // Listen for new member joins
        client.on(Events.GuildMemberAdd, async (member) => {
            try {
                const autoRoleId = process.env.AUTO_ROLE_ID;
                
                if (!autoRoleId) {
                    logger.warn('AUTO_ROLE_ID not configured in environment variables');
                    return;
                }

                // Find the role
                const role = member.guild.roles.cache.get(autoRoleId);
                
                if (!role) {
                    logger.warn(`Auto role with ID ${autoRoleId} not found in guild ${member.guild.name}`);
                    return;
                }

                // Check if bot has permission to manage roles
                if (!member.guild.members.me.permissions.has('ManageRoles')) {
                    logger.warn(`Bot lacks ManageRoles permission in guild ${member.guild.name}`);
                    return;
                }

                // Check if the role can be assigned (bot's highest role must be higher)
                if (member.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
                    logger.warn(`Bot's role is not high enough to assign auto role in guild ${member.guild.name}`);
                    return;
                }

                // Assign the role with a small delay to avoid rate limits
                setTimeout(async () => {
                    try {
                        await member.roles.add(role, 'Auto role assignment on join');
                        logger.info(`Auto role ${role.name} assigned to ${member.user.tag} in guild ${member.guild.name}`);
                    } catch (error) {
                        logger.error(`Failed to assign auto role to ${member.user.tag}:`, error);
                    }
                }, 1000);

            } catch (error) {
                logger.error('Error in autoRole system:', error);
            }
        });

        logger.info('Auto Role system initialized');
    }
};
