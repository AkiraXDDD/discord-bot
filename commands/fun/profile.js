const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');
const getColors = require('get-image-colors');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription("Check your profile or other's")
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Select a user')
                .setRequired(false)
        ),
    async execute(interaction) {
        const who = interaction.options.getUser('target') || interaction.user;
        const userData = db.prepare('SELECT * FROM snowball WHERE user_id = ?').get(who.id);
        const pfp = who.displayAvatarURL({dynamic: true});

        let prominentColor;
        try {
            const pfpResponse = await axios.get(pfp, { responseType: 'arraybuffer' });
            const pfpBuffer = Buffer.from(pfpResponse.data);
            const pngBuffer = await sharp(pfpBuffer).toFormat('png').toBuffer();
            const colors = await getColors(pngBuffer, 'image/png');
            prominentColor = colors[0].hex();
        } catch (error) {
            console.error('Error fetching avatar colors:', error);
            prominentColor = '#5865F2'
            }

        if (!userData) {
            if (who.id === interaction.user.id) {
                return interaction.reply(`Hey <@${interaction.user.id}> Start your snowballing journey with </start:1393994261992575038> !`);
            } else {
                return interaction.reply("Hey that user hasn't started their snowballing journey yet!");
            }
        }

        const stats = `Thrown: ${userData.thrown}\nHit: ${userData.hit}`
        const inv = `Snowballs: ${userData.snowball}\nCoin: ${userData.coin}`

        const profileEmbed = new EmbedBuilder()
            .setTitle(`${who.username}`)
            .setThumbnail(pfp)
            .setColor(prominentColor)
            .addFields(
                { name: 'Snowball Stats', value: stats, inline: true },
                { name: 'Inventory', value: inv, inline: true}
            )
        
        return interaction.reply({ embeds: [profileEmbed] });

    },
};