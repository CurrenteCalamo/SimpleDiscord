const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')
const User = require('../models/User')

function getRewardTimeStr(time) {
	let hours = Math.floor((time / (1000 * 60 * 60)) % 24)
	let minutes = Math.floor((time / (1000 * 60)) % 60)
	let seconds = Math.floor((time / 1000) % 60)

	if (minutes == 0) return `**${seconds}** секунд`
	if (hours == 0) return `**${minutes}** минут, **${seconds}** секунд`
	else return `**${hours}** часов, **${minutes}** минут, **${seconds}** секунд`
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Получить временную награду'),
	async execute(interaction) {
		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		let today = Date.now()
		if (user.rewardTime <= today) {
			let roll = Math.floor(Math.random() * 100) * user.multiplier
			user.coins += roll * user.multiplier
			const reward =
				user.multiplier > 1 ? ` **с** множителем **x${user.multiplier}**` : ''

			user.rewardTime = today + 12 * 60 * 60 * 1000
			await user.save()

			const Embed = new MessageEmbed()
				.setTitle('Временные награда')
				.setThumbnail(`${interaction.user.displayAvatarURL({ dynamic: true })}`)
				.setDescription(
					`<@${interaction.user.id}>, **Ваша** награда на сегодня **${roll}** койнов${reward}. **Возвращайтесь** через **12** часов.`,
				)
			return await interaction.reply({
				embeds: [Embed],
			})
		} else {
			const Embed = new MessageEmbed()
				.setTitle('Временные награда')
				.setThumbnail(`${interaction.user.displayAvatarURL({ dynamic: true })}`)
				.setDescription(
					`<@${
						interaction.user.id
					}>, **Вы** уже забрали **ежедневную** награду! Вы можете **получить** следующую через ${getRewardTimeStr(
						user.rewardTime - today,
					)}`,
				)
			return await interaction.reply({
				embeds: [Embed],
			})
		}
	},
}
