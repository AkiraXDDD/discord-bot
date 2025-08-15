const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags } = require('discord.js');
const db = require('../../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Check out the shop!"),

    async execute(interaction) {
        const user = interaction.user.id;

        let userData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(user);
        if (!userData) {
            return interaction.reply({ content: `Hey <@${user}> Start your snowballing journey with </start:1393994261992575038> !`, flags: MessageFlags.Ephemeral });
        }

        const buildShop = () => {
            const responses = db.prepare('SELECT * FROM responses').all();
            let valueVariable = '';
            const options = [];

            for (const r of responses) {
                const owns = db.prepare('SELECT 1 FROM user_responses WHERE user_id = ? AND response_id = ?').get(user, r.id);
                if (owns) {
                    valueVariable += `**${r.name} (owned)**\n> "${r.quote}"\n> Price: ${r.price} coins\n`;
                } else {
                    valueVariable += `**${r.name}**\n> Quote: "${r.quote}"\n> Price: ${r.price} coins\n`;
                    options.push({
                        label: r.name,
                        description: `Price: ${r.price} coins`,
                        value: String(r.id)
                    });
                }
            }

            const shopEmbed = new EmbedBuilder()
                .setTitle("Snowball Shop")
                .setDescription(`**Coins:** ${userData.coin}`)
                .setThumbnail('https://media.discordapp.net/attachments/1337483842558234746/1405849072765501574/Screenshot_20250810-143238.jpg')
                .addFields({ name: "Hit Response:", value: valueVariable || "No items available." })
                .setColor('Random');

            const row = options.length ? 
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('buy_response')
                        .setPlaceholder('Select an item to buy!')
                        .addOptions(options)
                ) 
                : null;

            return { embed: shopEmbed, components: row ? [row] : [] };
        };

        let { embed, components } = buildShop();
        const shopMessage = await interaction.reply({ embeds: [embed], components, fetchReply: true });

        const collector = shopMessage.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000,
            filter: i => i.user.id === user
        });

        collector.on('collect', async select => {
            const chosen = parseInt(select.values[0], 10);
            const item = db.prepare('SELECT * FROM responses WHERE id = ?').get(chosen);

            if (!item) {
                return select.reply({ content: "Invalid item.", flags: MessageFlags.Ephemeral });
            }

            const owns = db.prepare('SELECT 1 FROM user_responses WHERE user_id = ? AND response_id = ?').get(user, chosen);
            if (owns) {
                return select.reply({ content: "You already have it!!", flags: MessageFlags.Ephemeral });
            }

            userData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(user);
            if (userData.coin < item.price) {
                return select.reply({ content: "Not enough coins, buddy.", flags: MessageFlags.Ephemeral });
            }

            db.prepare('UPDATE snowball SET coin = coin - ? WHERE user_id = ?').run(item.price, user);
            db.prepare('INSERT INTO user_responses (user_id, response_id) VALUES (?, ?)').run(user, chosen);

            userData.coin -= item.price;

            await select.reply({ content: `You bought **${item.name}**! Thanks for doing business with me :>`, flags: MessageFlags.Ephemeral });

            let updated = buildShop();
            await shopMessage.edit({ embeds: [updated.embed], components: updated.components });
        });

        collector.on('end', () => {
            shopMessage.edit({ components: [] }).catch(() => {});
        });
    }
};
