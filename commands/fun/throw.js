const { SlashCommandBuilder, EmbedBuilder, MessageFlags, Embed } = require('discord.js');
const db = require('../../db');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('throw')
        .setDescription('Throw a snowball at someone!')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Someone you wanna throw at!')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('target');
        const userData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(user.id);
        const targetData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(target.id);

        if (!userData) {
            return interaction.reply({ content: `Hey <@${user.id}> Start your snowballing journey with </start:1393994261992575038> !`, flags: MessageFlags.Ephemeral });
        }

        if (!targetData) {
            return interaction.reply({ content: `Bro, ${target.username} hasn't even registered...`, flags: MessageFlags.Ephemeral });
        }

        if (target.id === user.id) {
            return interaction.reply({ content: "You can't hit yourself, silly!", flags: MessageFlags.Ephemeral });
        }

        if (userData.snowball < 1) {
            return interaction.reply({ content: "You don't have a snowball to throw, dummy.", flags: MessageFlags.Ephemeral });
        }

        db.prepare(`UPDATE snowball SET thrown = thrown + 1, snowball = snowball - 1 WHERE user_id = ?`).run(user.id);
        db.prepare(`UPDATE snowball SET hit = hit + 1 WHERE user_id = ?`).run(target.id);

        const gif = "https://media.tenor.com/CFilFMbT6-UAAAAC/rezero-petra.gif";

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag} chucked at big fat snowball at ${target.tag}!`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`**<@${target.id}> said: ${targetData.response || "Hey, that hurts!"}**`)
            .setColor('Random')
            .setImage(gif);
            
        return interaction.reply({ content: `Yoyoyo <@${target.id}>!`, embeds: [embed] });
    }
};

