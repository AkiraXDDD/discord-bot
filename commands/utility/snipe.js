const { SlashCommandBuilder, MessageFlags, EmbedBuilder, Embed } = require("discord.js");
const snipes = require("../../events/snipes");
const getColors = require('get-image-colors');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Shows the recently deleted message!'),
    
    async execute(interaction) {
        const snipe = snipes.get(interaction.channel.id);

        if (!snipe) {
            return interaction.reply({ 
                content: 'There is nothing to snipe!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const userPFP = interaction.user.displayAvatarURL({ dynamic: true });

        let prominentColor;
                        try {
                            const pfp = userPFP;
                            const pfpResponse = await axios.get(pfp, { responseType: 'arraybuffer' });
                            const pfpBuffer = Buffer.from(pfpResponse.data);
                            const pngBuffer = await sharp(pfpBuffer).toFormat('png').toBuffer();
                            const colors = await getColors(pngBuffer, 'image/png');
                            prominentColor = colors[0].hex();
                        } catch (error) {
                            console.error('Error fetching avatar colors:', error);
                            prominentColor = '#5865F2'
                        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.tag}'s snipe command`, iconURL: userPFP})
            .setDescription(`<@${snipe.author.id}> said: ${snipe.content || '[No text]'}`)
            .setColor(parseInt(prominentColor.replace('#', ''), 16))
            .setTimestamp();

        if (snipe.attachments.length > 0) {
            const imageAttachment = snipe.attachments.find(url => {
                const cleanURL = url.split('?')[0];
                return /\.(png|jpe?g|gif|webp)$/i.test(cleanURL);
            });

            if (imageAttachment) {
                embed.setImage(imageAttachment);
            }
        }

        interaction.reply({ embeds: [embed] });
    },
};