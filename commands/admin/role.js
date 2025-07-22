const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for adding role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new role')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the role')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Role color (hex code like #FF5733)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('mentionable')
                        .setDescription('Whether the role can be mentioned')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('hoist')
                        .setDescription('Whether to display role separately in member list')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'add':
                    await this.handleAddRole(interaction);
                    break;
                case 'remove':
                    await this.handleRemoveRole(interaction);
                    break;
                case 'create':
                    await this.handleCreateRole(interaction);
                    break;
            }

        } catch (error) {
            logger.error('Error executing role command:', error);
            await interaction.reply({
                content: 'An error occurred while managing roles.',
                ephemeral: true
            });
        }
    },

    async handleAddRole(interaction) {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return await interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }

        // Check role hierarchy
        if (role.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return await interaction.reply({
                content: 'You cannot manage roles equal to or higher than your highest role.',
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
                content: 'I cannot manage roles equal to or higher than my highest role.',
                ephemeral: true
            });
        }

        if (member.roles.cache.has(role.id)) {
            return await interaction.reply({
                content: `${user.tag} already has the ${role.name} role.`,
                ephemeral: true
            });
        }

        await member.roles.add(role, reason);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Role Added')
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Role', value: role.toString(), inline: true },
                { name: 'Added by', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        logger.info(`Role ${role.name} added to ${user.tag} by ${interaction.user.tag}`);
    },

    async handleRemoveRole(interaction) {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return await interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }

        // Check role hierarchy
        if (role.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return await interaction.reply({
                content: 'You cannot manage roles equal to or higher than your highest role.',
                ephemeral: true
            });
        }

        if (!member.roles.cache.has(role.id)) {
            return await interaction.reply({
                content: `${user.tag} doesn't have the ${role.name} role.`,
                ephemeral: true
            });
        }

        await member.roles.remove(role, reason);

        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🗑️ Role Removed')
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Role', value: role.toString(), inline: true },
                { name: 'Removed by', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        logger.info(`Role ${role.name} removed from ${user.tag} by ${interaction.user.tag}`);
    },

    async handleCreateRole(interaction) {
        const name = interaction.options.getString('name');
        const color = interaction.options.getString('color');
        const mentionable = interaction.options.getBoolean('mentionable') ?? false;
        const hoist = interaction.options.getBoolean('hoist') ?? false;

        // Validate color if provided
        let roleColor = null;
        if (color) {
            const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!colorRegex.test(color)) {
                return await interaction.reply({
                    content: 'Invalid color format. Please use hex format like #FF5733',
                    ephemeral: true
                });
            }
            roleColor = color;
        }

        const role = await interaction.guild.roles.create({
            name: name,
            color: roleColor,
            mentionable: mentionable,
            hoist: hoist,
            reason: `Role created by ${interaction.user.tag}`
        });

        const embed = new EmbedBuilder()
            .setColor(role.color || '#5865F2')
            .setTitle('🎭 Role Created')
            .addFields(
                { name: 'Role', value: role.toString(), inline: true },
                { name: 'Color', value: color || 'Default', inline: true },
                { name: 'Created by', value: interaction.user.tag, inline: true },
                { name: 'Mentionable', value: mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Hoisted', value: hoist ? 'Yes' : 'No', inline: true },
                { name: 'Position', value: role.position.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        logger.info(`Role ${role.name} created by ${interaction.user.tag}`);
    }
};