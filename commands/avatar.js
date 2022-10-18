const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription(
			'Получить аватар выбранного пользователя, или свой собственный',
		)
		.addUserOption((option) =>
			option.setName('target').setDescription('Пользователь'),
		),
	async execute(interaction) {
		const target = interaction.options.getUser('target')
		if (target && interaction.user.id != target.id) {
			const Embed = new MessageEmbed()
				.setTitle(`Аватар — ${target.username}`)
				.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
				.setImage(target.displayAvatarURL({ size: 2048, dynamic: true }))
				.setDescription(
					`<@${interaction.user.id}>, **Ниже** аватар <@${target.id}>`,
				)

			return await interaction.reply({
				embeds: [Embed],
			})
		} else {
			const Embed = new MessageEmbed()
				.setTitle(`Аватар — ${interaction.user.username}`)
				.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
				.setImage(
					interaction.user.displayAvatarURL({ size: 2048, dynamic: true }),
				)
				.setDescription(`<@${interaction.user.id}>, **Ниже** ваш аватар`)

			return await interaction.reply({
				embeds: [Embed],
			})
		}
	},
}
