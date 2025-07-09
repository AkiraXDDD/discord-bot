const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
require('dotenv').config();
const API_KEY = process.env.API;

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Add a song to the queue!')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('a song name or yt url of your choice!')
                .setRequired(true)
        ),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel)
            return interaction.editReply("You're not in a voice channel, dummy!");

        let url = query;

        if (!query.startsWith('http')) {
            const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${API_KEY}`;
            try {
                const res = await fetch(searchURL);
                const data = await res.json();
                if (!data.items || data.items.length === 0) {
                    return interaction.reply('No result, stupid.');
                }
                const videoId = data.items[0].id.videoId;
                url = `https://www.youtube.com/watch?v=${videoId}`;
            } catch (err) {
                console.error(err);
                return interaction.editReply("Akari couldn't search on youtube TwT");
            }
        }

        let song;
        try {
            const songInfo = await ytdl.getInfo(url);
            song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };
            console.log('song:', song);
        } catch (err) {
            console.error(err);
            return interaction.editReply('Invalid video, bakaa.');
        }

        let serverQueue = client.queue.get(interaction.guildId);
        if (!serverQueue) {
            const player = createAudioPlayer();

            const queueConstruct = {
                voiceChannel,
                textChannel: interaction.channel,
                connection: null,
                player,
                songs: [],
            };

            client.queue.set(interaction.guildId, queueConstruct);
            queueConstruct.songs.push(song);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });

                queueConstruct.connection = connection;
                connection.subscribe(player);

                play(interaction.guildId, queueConstruct, client);
                await interaction.editReply(`I shall now play **${song.title}**`);

            } catch (err) {
                console.error(err);
                client.queue.delete(interaction.guildId);
                return interaction.editReply("I couldn't connect to the vc, dumbass.");
            }
        } else {
            serverQueue.songs.push(song);
            return interaction.editReply(`Ugh fine! I'll add **${song.title}** to the queue.`);
        }
    }
};

function play(guildId, queueConstruct, client) {
    const song = queueConstruct.songs[0];
    if (!song) {
        queueConstruct.connection.destroy();
        client.queue.delete(guildId);
        return;
    }

    const stream = ytdl(song.url, { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    queueConstruct.player.play(resource);

    queueConstruct.player.once(AudioPlayerStatus.Idle, () => {
        queueConstruct.songs.shift();
        play(guildId, queueConstruct, client);
    });
}