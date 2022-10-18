const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const User = require('../models/User')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lvl')
		.setDescription('Показать мой текущий уровень'),
	async execute(interaction) {
		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		const Embed = new MessageEmbed()
			.setTitle(`Текущий уровень — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: 'Уровень:', value: `\`\`\`${user.lvl}\`\`\``, inline: true },
				{ name: 'Опыт:', value: `\`\`\`${user.xp}/30\`\`\``, inline: true },
			)
		return await interaction.reply({
			embeds: [Embed],
		})
	},
}
