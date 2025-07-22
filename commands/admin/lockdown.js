const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock channels to prevent/allow messaging')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a channel or entire server')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to lock (leave empty to lock all channels)')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for lockdown')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a channel or entire server')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to unlock (leave empty to unlock all channels)')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for unlock')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const targetChannel = interaction.options.getChannel('channel');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const isLock = subcommand === 'lock';

            await interaction.deferReply();

            if (targetChannel) {
                // Lock/unlock specific channel
                await this.toggleChannelLock(targetChannel, isLock, reason);
                
                const embed = new EmbedBuilder()
                    .setColor(isLock ? '#FF0000' : '#00FF00')
                    .setTitle(isLock ? '🔒 Channel Locked' : '🔓 Channel Unlocked')
                    .addFields(
                        { name: 'Channel', value: targetChannel.toString(), inline: true },
                        { name: 'Action by', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                logger.info(`Channel ${targetChannel.name} ${isLock ? 'locked' : 'unlocked'} by ${interaction.user.tag}`);
            } else {
                // Lock/unlock all text channels
                const channels = interaction.guild.channels.cache.filter(ch => 
                    ch.type === ChannelType.GuildText && 
                    ch.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageChannels)
                );

                let successCount = 0;
                let failCount = 0;

                for (const [, channel] of channels) {
                    try {
                        await this.toggleChannelLock(channel, isLock, reason);
                        successCount++;
                        // Small delay to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        failCount++;
                        logger.warn(`Failed to ${isLock ? 'lock' : 'unlock'} channel ${channel.name}:`, error.message);
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor(isLock ? '#FF0000' : '#00FF00')
                    .setTitle(isLock ? '🔒 Server Lockdown' : '🔓 Server Unlocked')
                    .addFields(
                        { name: 'Channels Affected', value: `${successCount} successful, ${failCount} failed`, inline: true },
                        { name: 'Action by', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                logger.info(`Server ${isLock ? 'lockdown' : 'unlock'} executed by ${interaction.user.tag}: ${successCount} channels affected`);
            }

        } catch (error) {
            logger.error('Error executing lockdown command:', error);
            const errorReply = {
                content: 'An error occurred while executing the lockdown command.',
                ephemeral: true
            };
            
            if (interaction.deferred) {
                await interaction.editReply(errorReply);
            } else {
                await interaction.reply(errorReply);
            }
        }
    },

    async toggleChannelLock(channel, lock, reason) {
        const everyone = channel.guild.roles.everyone;
        
        if (channel.type === ChannelType.GuildText) {
            // For text channels, manage Send Messages permission
            if (lock) {
                await channel.permissionOverwrites.edit(everyone, {
                    SendMessages: false
                }, { reason });
            } else {
                await channel.permissionOverwrites.edit(everyone, {
                    SendMessages: null // Reset to default
                }, { reason });
            }
        } else if (channel.type === ChannelType.GuildVoice) {
            // For voice channels, manage Connect permission
            if (lock) {
                await channel.permissionOverwrites.edit(everyone, {
                    Connect: false
                }, { reason });
            } else {
                await channel.permissionOverwrites.edit(everyone, {
                    Connect: null // Reset to default
                }, { reason });
            }
        }
    }
};