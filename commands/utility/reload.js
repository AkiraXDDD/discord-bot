const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}


        try {
			const commandsFolder= path.join(__dirname, '..');
			let commandPath = null;

			fs.readdirSync(commandsFolder, { withFileTypes: true }).forEach(dirent => {
                if (dirent.isDirectory()) {
                    const filePath = path.join(commandsFolder, dirent.name, `${commandName}.js`);
                    if (fs.existsSync(filePath)) {
                        commandPath = filePath;
                    }
                }
            });

			if (!commandPath) {
				return interaction.reply(`Couldn't find a file for the command \`${commandName}\`.`);
			}

			delete require.cache[require.resolve(commandPath)];

            const newCommand = require(commandPath);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
        
        }
	},
};