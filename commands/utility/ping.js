const { SlashCommandBuilder } = require("discord.js");
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and Pong again after a few secs!'),
    async execute(interaction) {
        await interaction.reply('Pong!');
        await wait(2_000);
        await interaction.editReply('Pong again!')
    },
};
