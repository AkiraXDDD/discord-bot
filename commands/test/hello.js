const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
require('dotenv').config();
const API_KEY = process.env.API;
const getColors = require('get-image-colors');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Sends a random waving GIF')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Select a user to wave at!')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const author = interaction.user;

        await interaction.deferReply();

        const query = 'anime wave';
        const limit = 8;

        try {
            const response = await fetch(`https://tenor.googleapis.com/v2/search?q=${query}&limit=${limit}&key=${API_KEY}&media_filter=minimal`);
            const data = await response.json();


            if (!data || !data.results || data.results.length === 0) {
                return interaction.reply("Oops! I couldn't find any GIF! 😢");

            }

            const randomIndex = Math.floor(Math.random() * data.results.length);
            const selectedGIF = data.results[randomIndex];

            if (!selectedGIF.media_formats || !selectedGIF.media_formats.gif) {
                return interaction.reply("Oops! The selected GIF doesn't have a valid media format.");
            }

            const gifUrl = selectedGIF.media_formats.gif.url;

            const gifResponse = await axios.get(gifUrl, { responseType: 'arraybuffer'});
            const gifBuffer = Buffer.from(gifResponse.data);

            const pngBuffer = await sharp(gifBuffer).toFormat('png').toBuffer();

            const colors = await getColors(pngBuffer, 'image/png');
            const prominentColor = colors[0].hex();

            const embed = new EmbedBuilder()
                .setImage(gifUrl)
                .setColor(parseInt(prominentColor.replace("#", ""), 16))
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ content: `${author.username} is waving at you, <@${user.id}>! 👋`, embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply("Oopsies! Somethings had gone wrong.");
        }
    }
}
