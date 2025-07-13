const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Begin your fun snowballing journey!'),

    async execute(interaction) {
        const id = interaction.user.id;
        const exist = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(id);

        if (exist) {
            return interaction.reply({ content: "You've already registered, silly.", flags: MessageFlags.Ephemeral });
        } 

        db.prepare('INSERT INTO snowball (user_id, thrown, hit, snowball, coin) VALUES (?, 0, 0, 3, 500)').run(id);
        return interaction.reply("I've given you 3 snowballs and 500 coins. You can now start your snowballing journey, GLHF!");
    },
}