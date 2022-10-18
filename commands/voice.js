const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const { getVoiceTimeStr } = require('../components.js')
const User = require('../models/User.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('voice')
		.setDescription('Показать мое время онлайн'),
	async execute(interaction) {
		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		let todayTime = new Date().getDate()
		if (user.lastTime != 1 && todayTime == 1) {
			user.lastTime = 0
		}
		if (user.lastTime < todayTime) {
			user.dayTime = 0
			user.lastTime = todayTime
			await user.save()
		}

		const Embed = new MessageEmbed()
			.setTitle(`Время онлайн — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{
					name: 'За сутки',
					value: `\`\`\`${getVoiceTimeStr(user.dayTime)}\`\`\``,
					inline: true,
				},
				{
					name: 'За всё время',
					value: `\`\`\`${getVoiceTimeStr(user.allTime)}\`\`\``,
					inline: true,
				},
			)
		return await interaction.reply({
			embeds: [Embed],
		})
	},
}
