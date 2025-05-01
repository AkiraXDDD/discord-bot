const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType, MessageFlags } = require('discord.js');
const getColors = require('get-image-colors');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock, Paper, Scissors with the bot!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('pve')
                .setDescription('Player vs Bot mode!')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pvp')
                .setDescription('Player vs Player mode!')
                .addUserOption(option =>
                    option
                        .setName('opponent')
                        .setDescription('Choose your opponent')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const user = interaction.user;
        const userPFP = user.displayAvatarURL({ dynamic: true});

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
        
        const rpsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('rock')
                    .setLabel('Rock')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🪨'),
                new ButtonBuilder()
                    .setCustomId('paper')
                    .setLabel('Paper')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📄'),
                new ButtonBuilder()
                    .setCustomId('scissors')
                    .setLabel('Scissors')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('✂️')
            );

        if (interaction.options.getSubcommand() === 'pvp') {
            const user2 = interaction.options.getUser('opponent');

            if (user.id == user2.id) {
                return interaction.reply({ content: "You can't challenge yourself!", ephemeral: true});
            }

            if (user2.bot) {
                return interaction.reply({ content: "You can't challenge a bot!", ephemeral: true });
            }
            
            const challengeEmbed = new EmbedBuilder()
                .setAuthor({ name: `${user.tag}'s rock-paper-scissors challenge!`, iconURL: userPFP})
                .setDescription(`${user.tag} has challenged you to a game! Do you accept?`)
                .setColor(parseInt(prominentColor.replace('#', ''), 16));

            const challengeRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('decline')
                        .setLabel('Decline')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❎')
                );

            await interaction.reply({
                content: `Hey! ${user2}`,
                embeds: [challengeEmbed],
                components: [challengeRow]
            });
            const initialReply = await interaction.fetchReply();

            const collector = interaction.channel.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 15000,
                filter: i => i.user.id === user2.id
            });

            collector.on('collect', async i => {
                if (i.customId === 'decline') {
                    const declinedEmbed = EmbedBuilder.from(challengeEmbed)
                        .setDescription(`${user2} declined the challenge!`);
                    await i.update({ content: `Coward! ${user2}`, embeds: [declinedEmbed], components: [] });
                    collector.stop();
                    return;
                }
    
                if (i.customId === 'accept') {
                    collector.stop();
                    const emoji = {
                        rock: '🪨',
                        paper: '📄',
                        scissors: '✂️'
                    };
    
                    const instructionEmbed = EmbedBuilder.from(challengeEmbed)
                        .setDescription('Both players, **click a button** to choose rock, paper, or scissors.');
    
                    await i.update({ embeds: [instructionEmbed], components: [rpsRow] });
    
                    const moves = {};
    
                    const gameCollector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 20000,
                        filter: i => i.user.id === user.id || i.user.id === user2.id,
                    });
    
                    gameCollector.on('collect', async i => {
                        if (i.user.id === user.id && !moves[user.id]) {
                            moves[user.id] = i.customId;
                            await i.reply({ content: `You picked: **${i.customId}** ${emoji[i.customId]}`, flags: MessageFlags.Ephemeral });
                        } else if (i.user.id === user2.id && !moves[user2.id]) {
                            moves[user2.id] = i.customId;
                            await i.reply({ content: `You picked: **${i.customId}** ${emoji[i.customId]}`, flags: MessageFlags.Ephemeral });
                        } else {
                            await i.reply({ content: "You've already made your choice!", flags: MessageFlags.Ephemeral });
                        }
    
                        if (moves[user.id] && moves[user2.id]) {
                            gameCollector.stop();
                            const p1 = moves[user.id];
                            const p2 = moves[user2.id];
    
                            let result;
                            if (p1 === p2) {
                                result = "**It's a tie!**";
                            } else if (
                                (p1 === 'rock' && p2 === 'scissors') ||
                                (p1 === 'scissors' && p2 === 'paper') ||
                                (p1 === 'paper' && p2 === 'rock')
                            ) {
                                result = `**You win!**`;
                            } else {
                                result = `**${user2.tag} wins!**`;
                            }
    
                            const resultEmbed = EmbedBuilder.from(challengeEmbed)
                                .setDescription(
                                    `**You** chose: ${p1} ${emoji[p1]}\n` +
                                    `**${user2.tag}** chose: ${p2} ${emoji[p2]}\n\n` +
                                    `**${result}**`
                                );
    
                            await initialReply.edit({ embeds: [resultEmbed], components: [] });
                        }
                    });
    
                    gameCollector.on('end', async collected => {
                        const disabledRow2 = ActionRowBuilder.from(rpsRow).setComponents(
                            rpsRow.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                        );
                        if (!moves[user.id] || !moves[user2.id]) {
                            await initialReply.edit({ content: "Time's up! Someone forgot to respond.", components: [disabledRow2] });
                        }
                    });
                }
            });

            collector.on('end', async (_, reason) => {
                const disabledRow = ActionRowBuilder.from(challengeRow).setComponents(
                    challengeRow.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                );
                if (reason === 'time') {
                    await initialReply.edit({ content: 'Challenge timed out.', components: [disabledRow] });
                }
            });

        } 
        
        else if(interaction.options.getSubcommand() === 'pve') {

            const defaultEmbed = new EmbedBuilder()
                .setAuthor({ name: `${user.tag}'s rock-paper-scissors challenge!`, iconURL: userPFP})
                .setDescription('**Click a button below** to choose your move!')
                .setColor(parseInt(prominentColor.replace('#', ''), 16));

            const defaultMessage = await interaction.reply({
                embeds: [defaultEmbed],
                components: [rpsRow]
            });

            const filter = (i) => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time:15000 });

            collector.on('collect', async (i) => {
                const userChoice = i.customId;
                const choices = ['rock', 'paper', 'scissors'];
                const emoji = {
                    rock: '🪨',
                    paper: '📄',
                    scissors: '✂️'
                };
                const botChoice = choices[Math.floor(Math.random() * choices.length)];

                let result;
                if (userChoice === botChoice) {
                    result = "**It's a tie!**";
                } else if (
                    (userChoice === 'rock' && botChoice === 'scissors') ||
                    (userChoice === 'paper' && botChoice === 'rock') ||
                    (userChoice === 'scissors' && botChoice === 'paper')
                ) {
                    result = "**You win!**";
                } else {
                    result = "**You lose!**";
                }

                const resultEmbed = EmbedBuilder.from(defaultEmbed)
                    .setDescription(
                        `**You** chose: ${userChoice} ${emoji[userChoice]}\n` +
                        `**Bot** chose: ${botChoice} ${emoji[botChoice]}\n\n` +
                        `${result}`
                    );
                
                await i.update({ embeds: [resultEmbed], components: [] });

                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                const disableRow = ActionRowBuilder.from(rpsRow).setComponents(
                    rpsRow.components.map(button => ButtonBuilder.from(button)
                        .setDisabled(true)
                    )
                );
                if (reason === 'time') {
                    interaction.editReply({
                        content: "Time's up! No response received.",
                        components: [disableRow]
                    });
                }
            });

        }
    },
};