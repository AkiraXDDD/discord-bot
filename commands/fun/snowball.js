const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../db');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('snowball')
        .setDescription('Snowball Command!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('throw')
                .setDescription('Throw a snowball at someone!')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('Select a user to throw a snowball at')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Check snowball stats!')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('Select a user to check the stats!')
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.user;

        switch (subcommand) {
            case 'throw': {
                const target = interaction.options.getUser('target');
                const userData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(user.id);
                const targetData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(target.id);

                if (!userData) {
                    return interaction.reply(`Hey <@${user.id}> Start your snowballing journey with /start !`);
                }

                if (!targetData) {
                    return interaction.reply(`Bro, ${target.username} hasn't even registered...`);
                }

                if (target.id === user.id) {
                    return interaction.reply({ content: "You can't hit yourself, silly!", flags: MessageFlags.Ephemeral });
                }

                if (userData.snowball < 1) {
                    return interaction.reply("You don't have a snowball to throw, dummy.");
                }

                db.prepare(`UPDATE snowball SET thrown = thrown + 1, snowball = snowball - 1 WHERE user_id = ?`).run(user.id);
                db.prepare(`UPDATE snowball SET hit = hit + 1 WHERE user_id = ?`).run(target.id);
                
                const throwStats = db.prepare(`SELECT thrown FROM snowball WHERE user_id = ?`).get(user.id);
                const hitStats = db.prepare(`SELECT hit FROM snowball WHERE user_id = ?`).get(target.id);
            
                return interaction.reply(
                    `<@${user.id}> chucked a big fat snowball at <@${target.id}>! <a:snowball_throw:1392166700744441906>\n` +
                    `${user.username} has thrown ${throwStats.thrown} snowballs!\n` +
                    `${target.username} has been hit by snowballs ${hitStats.hit} times!`
                );
            }
            
            case 'stats' : {
                const target = interaction.options.getUser('target') || interaction.user ;

                db.prepare(`INSERT OR IGNORE INTO snowball (user_id) VALUES (?)`).run(target.id);

                const stats = db.prepare(`SELECT thrown, hit FROM snowball WHERE user_id = ?`).get(target.id);

                if (!stats) {
                    return interaction.reply(`Hey <@${user.id}> Start your snowballing journey with /start !`);
                }

                return interaction.reply(`HMPH! It's not like I'm following your order but here's your stats <@${target.id}>\n` +
                    `Snowballs Thrown: ${stats.thrown}\n` +
                    `Snowballs Hit: ${stats.hit}`
                )
            }
        }
    }
};

