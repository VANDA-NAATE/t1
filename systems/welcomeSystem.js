const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'welcomeSystem',
    
    init(client) {
        // Welcome new members
        client.on(Events.GuildMemberAdd, async (member) => {
            try {
                const guild = member.guild;
                const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
                
                if (!welcomeChannelId) {
                    logger.info(`New member ${member.user.tag} joined ${guild.name} - No welcome channel configured`);
                    return;
                }
                
                const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
                if (!welcomeChannel) {
                    logger.warn(`Welcome channel ${welcomeChannelId} not found in ${guild.name}`);
                    return;
                }
                
                // Create welcome embed
                const embed = new EmbedBuilder()
                    .setColor('#00FF7F')
                    .setTitle(`Welcome to ${guild.name}! 🎉`)
                    .setDescription(`Hey ${member}, welcome to our awesome community!`)
                    .addFields(
                        { name: '👤 Member Count', value: `You're member #${guild.memberCount}`, inline: true },
                        { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                        { name: '🎭 What to do next', value: '• Read the rules\n• Introduce yourself\n• Have fun chatting!', inline: false }
                    )
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setTimestamp()
                    .setFooter({
                        text: guild.name,
                        iconURL: guild.iconURL()
                    });
                
                // Add server info if available
                if (guild.rulesChannelId) {
                    embed.addFields({
                        name: '📋 Rules',
                        value: `Make sure to check out <#${guild.rulesChannelId}>`,
                        inline: true
                    });
                }
                
                await welcomeChannel.send({
                    content: `${member} Welcome to the server!`,
                    embeds: [embed]
                });
                
                // Send welcome DM
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#4A90E2')
                        .setTitle(`Welcome to ${guild.name}!`)
                        .setDescription('Thanks for joining our community! Here are some tips to get started:')
                        .addFields(
                            { name: '🔍 Getting Started', value: '• Read the server rules\n• Check out the different channels\n• Don\'t hesitate to ask questions!', inline: false },
                            { name: '📞 Need Help?', value: 'Feel free to message any moderator if you need assistance.', inline: false }
                        )
                        .setThumbnail(guild.iconURL())
                        .setTimestamp();
                    
                    await member.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    logger.info(`Could not send welcome DM to ${member.user.tag}`);
                }
                
                logger.info(`Welcome message sent for ${member.user.tag} in ${guild.name}`);
                
            } catch (error) {
                logger.error('Error in welcome system:', error);
            }
        });
        
        // Say goodbye to leaving members
        client.on(Events.GuildMemberRemove, async (member) => {
            try {
                const guild = member.guild;
                const goodbyeChannelId = process.env.GOODBYE_CHANNEL_ID || process.env.WELCOME_CHANNEL_ID;
                
                if (!goodbyeChannelId) return;
                
                const goodbyeChannel = guild.channels.cache.get(goodbyeChannelId);
                if (!goodbyeChannel) return;
                
                // Simple goodbye message
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('Member Left')
                    .setDescription(`**${member.user.tag}** has left the server`)
                    .addFields(
                        { name: '👤 Member Count', value: `We now have ${guild.memberCount} members`, inline: true },
                        { name: '⏰ Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true }
                    )
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                
                await goodbyeChannel.send({ embeds: [embed] });
                
                logger.info(`Goodbye message sent for ${member.user.tag} from ${guild.name}`);
                
            } catch (error) {
                logger.error('Error in goodbye system:', error);
            }
        });
        
        // Member milestone celebrations
        client.on(Events.GuildMemberAdd, async (member) => {
            try {
                const guild = member.guild;
                const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
                
                if (milestones.includes(guild.memberCount)) {
                    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
                    if (!welcomeChannelId) return;
                    
                    const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
                    if (!welcomeChannel) return;
                    
                    const milestoneEmbed = new EmbedBuilder()
                        .setColor('#FFD700')
                        .setTitle(`🎉 MILESTONE REACHED! 🎉`)
                        .setDescription(`We've just reached **${guild.memberCount}** members!`)
                        .addFields({
                            name: '🏆 Achievement Unlocked',
                            value: `Thanks to everyone who helped us reach this milestone!\nSpecial thanks to ${member} for being our ${guild.memberCount}th member!`,
                            inline: false
                        })
                        .setThumbnail(guild.iconURL({ size: 256 }))
                        .setTimestamp();
                    
                    await welcomeChannel.send({
                        content: '@everyone',
                        embeds: [milestoneEmbed]
                    });
                    
                    logger.info(`Milestone celebration: ${guild.name} reached ${guild.memberCount} members`);
                }
                
            } catch (error) {
                logger.error('Error in milestone celebration:', error);
            }
        });
        
        logger.info('Welcome System initialized');
    }
};