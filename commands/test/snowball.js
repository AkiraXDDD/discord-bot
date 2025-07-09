const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const db = require('../../db');

module.exports = {
    cooldown: 30,
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

                if (target.id === user.id) {
                    return interaction.reply({ content: "You can't hit yourself, silly!", flags: MessageFlags.Ephemeral });
                }

                db.prepare(`INSERT OR IGNORE INTO snowball_stats (user_id) VALUES (?)`).run(user.id);
                db.prepare(`INSERT OR IGNORE INTO snowball_stats (user_id) VALUES (?)`).run(target.id);

                db.prepare(`UPDATE snowball_stats SET thrown = thrown + 1 WHERE user_id = ?`).run(user.id);
                db.prepare(`UPDATE snowball_stats SET hit = hit + 1 WHERE user_id = ?`).run(target.id);

                const throwStats = db.prepare(`SELECT thrown FROM snowball_stats WHERE user_id  = ?`).get(user.id);
                const hitStats = db.prepare(`SELECT hit FROM snowball_stats WHERE user_id = ?`).get(target.id);

                return interaction.reply(`<@${user.id}> chucked a big fat snowball at <@${target.id}>! <a:snowball_throw:1392166700744441906>\n` +
                    `${user.username} has thrown ${throwStats.thrown} snowballs!\n` +
                    `${target.username} has been hit by snowballs ${hitStats.hit} times!`
                );
            }
            
            case 'stats' : {
                const target = interaction.options.getUser('target') || interaction.user ;

                db.prepare(`INSERT OR IGNORE INTO snowball_stats (user_id) VALUES (?)`).run(target.id);

                const stats = db.prepare(`SELECT thrown, hit FROM snowball_stats WHERE user_id = ?`).get(target.id);

                return interaction.reply(`HMPH! It's not like I'm following your order but here's your stats <@${target.id}>\n` +
                    `Snowballs Thrown: ${stats.thrown}\n` +
                    `Snowballs Hit: ${stats.hit}`
                )
            }
        }
    }
};

