const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current song queue!'),
    
    async execute(interaction, client) {
        const queue = client.queue?.get(interaction.guildId);

        if (!queue || !queue.songs.length) {
            return await interaction.reply("Are you dumb? There's no queue, right now!");
        }

        const currentsong = queue.songs[0];
        const nextsong = queue.songs.slice(1);

        const queueEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({dynamic: true}) })
            .setColor('#E91E63')
            .setTitle('Music Queue')
            .addFields(
                {
                    name: 'I am currently busy, playing',
                    value: `[${currentsong.title}](${currentsong.url})`,
                }
            )
            .setFooter(
                {
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({dynamic: true})
                }
            );

        if (nextsong.length > 0) {
            const upcominglist = nextsong
                .map((song, index) => `\`${index + 1}\` .[${song.title}](${song.url})`)
                .join('\n');

            queueEmbed
                .addFields(
                    {
                        name: "What's next?",
                        value: upcominglist
                    }
                );
        }

        return await interaction.reply({embeds: [queueEmbed]});
    }
}