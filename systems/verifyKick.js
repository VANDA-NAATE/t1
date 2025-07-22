const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'verifyKick',
    
    init(client) {
        // Store pending verification checks
        const verificationTimers = new Map();

        // Listen for new member joins
        client.on(Events.GuildMemberAdd, async (member) => {
            try {
                const verifyRoleId = process.env.VERIFY_ROLE_ID;
                const timeoutMinutes = parseInt(process.env.VERIFY_TIMEOUT_MINUTES) || 10;

                if (!verifyRoleId) {
                    logger.warn('VERIFY_ROLE_ID not configured in environment variables');
                    return;
                }

                // Find the verification role
                const verifyRole = member.guild.roles.cache.get(verifyRoleId);
                
                if (!verifyRole) {
                    logger.warn(`Verify role with ID ${verifyRoleId} not found in guild ${member.guild.name}`);
                    return;
                }

                // Check if bot has permission to kick members
                if (!member.guild.members.me.permissions.has('KickMembers')) {
                    logger.warn(`Bot lacks KickMembers permission in guild ${member.guild.name}`);
                    return;
                }

                logger.info(`Started verification timer for ${member.user.tag} in guild ${member.guild.name} (${timeoutMinutes} minutes)`);

                // Set timeout for verification check
                const timer = setTimeout(async () => {
                    try {
                        // Fetch fresh member data to check current roles
                        const freshMember = await member.guild.members.fetch(member.id).catch(() => null);
                        
                        // If member left or was kicked already, clean up
                        if (!freshMember) {
                            verificationTimers.delete(member.id);
                            return;
                        }

                        // Check if user now has the verification role
                        if (freshMember.roles.cache.has(verifyRoleId)) {
                            logger.info(`User ${member.user.tag} successfully verified in guild ${member.guild.name}`);
                            verificationTimers.delete(member.id);
                            return;
                        }

                        // Check if member can be kicked
                        if (!freshMember.kickable) {
                            logger.warn(`Cannot kick ${member.user.tag} - insufficient permissions or higher role`);
                            verificationTimers.delete(member.id);
                            return;
                        }

                        // Try to DM user before kicking
                        try {
                            await member.user.send({
                                content: `⚠️ You have been removed from **${member.guild.name}** for not completing verification within ${timeoutMinutes} minutes.\n\nYou can rejoin and complete verification if this was a mistake.`
                            });
                        } catch (dmError) {
                            logger.warn(`Could not DM ${member.user.tag} about verification kick`);
                        }

                        // Kick the member
                        await freshMember.kick(`Failed to verify within ${timeoutMinutes} minutes`);
                        
                        logger.info(`Kicked ${member.user.tag} from guild ${member.guild.name} for not verifying within ${timeoutMinutes} minutes`);
                        
                        // Clean up timer
                        verificationTimers.delete(member.id);

                    } catch (error) {
                        logger.error(`Error kicking unverified member ${member.user.tag}:`, error);
                        verificationTimers.delete(member.id);
                    }
                }, timeoutMinutes * 60 * 1000);

                // Store timer for potential cleanup
                verificationTimers.set(member.id, timer);

            } catch (error) {
                logger.error('Error in verifyKick system:', error);
            }
        });

        // Listen for role updates to cancel verification timer
        client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            try {
                const verifyRoleId = process.env.VERIFY_ROLE_ID;
                
                if (!verifyRoleId) return;

                // Check if member gained the verification role
                const hadRole = oldMember.roles.cache.has(verifyRoleId);
                const hasRole = newMember.roles.cache.has(verifyRoleId);

                if (!hadRole && hasRole && verificationTimers.has(newMember.id)) {
                    // Member got verified, cancel the kick timer
                    clearTimeout(verificationTimers.get(newMember.id));
                    verificationTimers.delete(newMember.id);
                    logger.info(`Verification timer cancelled for ${newMember.user.tag} - role assigned`);
                }

            } catch (error) {
                logger.error('Error in verifyKick role update handler:', error);
            }
        });

        // Listen for member leave to cleanup timers
        client.on(Events.GuildMemberRemove, (member) => {
            if (verificationTimers.has(member.id)) {
                clearTimeout(verificationTimers.get(member.id));
                verificationTimers.delete(member.id);
                logger.info(`Verification timer cleaned up for ${member.user.tag} - member left`);
            }
        });

        logger.info('Verify Kick system initialized');
    }
};
