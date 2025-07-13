const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
    cooldown: 120,
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins and snowballs!'),
    async execute(interaction) {
        const id = interaction.user.id;
        const data = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(id);

        if (!data) {
            return interaction.reply(`Hey <@${id}> Start your snowballing journey with /start !`);
        }

        db.prepare('UPDATE snowball SET snowball = snowball + 3, coin = coin + 100 WHERE user_id = ?').run(id);

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s daily rewards`)
            .setDescription('> + 3 snowballs and 100 coins given to you!')
            .setColor('Random')

        return interaction.reply({ embeds: [embed] })
    }
};