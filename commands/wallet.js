const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const User = require('../models/User')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wallet')
		.setDescription('Показать мой текущий баланс'),
	async execute(interaction) {
		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		const Embed = new MessageEmbed()
			.setTitle(`Текущий баланс — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{
					name: 'Койнов:',
					value: `\`\`\`${user.coins}\`\`\``,
					inline: true,
				},
				{
					name: 'Рублей:',
					value: `\`\`\`${user.rubles}\`\`\``,
					inline: true,
				},
			)
		return await interaction.reply({
			embeds: [Embed],
		})
	},
}
