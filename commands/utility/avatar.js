const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getColors = require('get-image-colors');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Display a user's avatar")
        .addUserOption(option =>
            option 
                .setName('target')
                .setDescription('Select a user')
                .setRequired(true)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const pfp = target.displayAvatarURL({dynamic : true, size: 512});

        let prominentColor;
                try {
                    const targetpfp = pfp;
                    const pfpResponse = await axios.get(targetpfp, { responseType: 'arraybuffer' });
                    const pfpBuffer = Buffer.from(pfpResponse.data);
                    const pngBuffer = await sharp(pfpBuffer).toFormat('png').toBuffer();
                    const colors = await getColors(pngBuffer, 'image/png');
                    prominentColor = colors[0].hex();
                } catch (error) {
                    console.error('Error fetching avatar colors:', error);
                    prominentColor = '#5865F2'
                }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${target.tag}'s avatar`})
            .setImage(pfp)
            .setColor(parseInt(prominentColor.replace('#', ''), 16));
        
        await interaction.reply({ embeds: [embed]});
    }
}