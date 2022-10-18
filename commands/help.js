const fs = require('fs')
const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Получить страницу справки сервера'),
	async execute(interaction) {
		let str = `**Страница справки серевера:**\n`
		const commandFiles = fs
			.readdirSync('./commands')
			.filter((file) => file.endsWith('.js'))

		for (const file of commandFiles) {
			const command = require(`./${file}`)
			if (command.data.name == 'help') continue
			str += `- \`/${command.data.name}\` — ${command.data.description}.\n`
		}
		return await interaction.reply({
			content: str,
			ephemeral: true,
		})
	},
}
