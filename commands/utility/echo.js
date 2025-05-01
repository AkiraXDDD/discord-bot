const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies with your input!')
        .addStringOption(option => 
            option.setName('input')
                .setDescription('Your Message Goes Here!')
                .setMaxLength(2_000)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('private')
                .setDescription('If you want your echoed message to be private!')
                .setRequired(true)
        ),
    async execute(interaction) {
        const message = interaction.options.getString('input');
        const isprivate = interaction.options.getBoolean('private') || false;
        await interaction.reply({
            content: message,
            flags: isprivate ? MessageFlags.Ephemeral : 0
        });
    },
}