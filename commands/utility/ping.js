const { SlashCommandBuilder } = require("discord.js");
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot ping!'),
    async execute(interaction) {
        const check = await interaction.reply({ content: 'Hm....', fetchReply: true});
        const ping = check.createdTimestamp - interaction.createdTimestamp;
        
        await interaction.editReply(`Pong is ${ping} ms!`);
    },
};
