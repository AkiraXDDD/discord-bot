const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("Gives User's Info!")
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Info about a user')
                .addUserOption(option => 
                    option.setName('target')
                        .setDescription('Select a user!')
                        .setRequired(false)
                )  
            )     
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Info about the server')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Select a role!')
                        .setRequired(false)
                )
                
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Select a channel!')
                        .setRequired(false)
                )
            ),
    async execute(interaction) {
        let response = "Here's the info you requested:\n";
        
        if (interaction.options.getSubcommand() === 'user') {
            const user = interaction.options.getUser('target') || interaction.user;
            response += `**User:** ${user.tag} (ID: ${user.id})\n`;
            response += `**Created on:** ${user.createdAt}`
        }
        else if (interaction.options.getSubcommand() === 'server') {
            const role = interaction.options.getRole('role');
            const channel = interaction.options.getChannel('channel');

            if (role) {
                response += `**Role:** ${role.name} (ID: ${role.id})\n`;
                response += `**Created on:** ${role.createdAt}\n`;
            }

            if (channel) {
                response += `**Channel:** ${channel.name} (ID: ${channel.id})\n`;
                response += `**Created on:** ${channel.createdAt}\n`;
            }

            if (!role && !channel) {
                response = "You forgot to select an option, mate.";
            }
        }

        await interaction.reply(response);
    },
};