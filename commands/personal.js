const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const User = require('../models/User')
const Personal = require('../models/Personal')
const Product = require('../models/Product')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('personal')
		.setDescription('Создать персональную комнату'),
	async execute(interaction) {
		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		if (user.personalRoomId) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Вы** уже **состоите** в персональнальной **комнате!**`,
				ephemeral: true,
			})
		}
		const Embed = new MessageEmbed()
			.setTitle(`Персональная комната — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${interaction.user.id}>, **Вы** уверены, что хотите **создать** персональную **комнату?**`,
			)

		const Buttons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Отмена')
				.setStyle('DANGER')
				.setCustomId('cancel'),
			new MessageButton()
				.setLabel('Создать')
				.setStyle('SUCCESS')
				.setCustomId('create'),
		)

		const initialInteraction = await interaction.reply({
			embeds: [Embed],
			components: [Buttons],
			fetchReply: true,
		})

		const filter = (i) => {
			i.deferUpdate()
			return i.user.id == interaction.user.id
		}
		const collector = initialInteraction.createMessageComponentCollector({
			filter,
			time: 10000,
		})
		collector.on('collect', async (i) => {
			switch (i.customId) {
				case 'create': {
					if (user.coins >= 5000) {
						user.money -= 5000

						const personal = await Personal.create({
							ownerId: interaction.user.id,
							title: interaction.user.tag,
						})
						user.personalRoomId = personal.id
						await user.save()

						let roleInfo = await Product.findOne({
							roleId: '1027594002205257798',
						})
						roleInfo.terms.set(i.user.id, 30 * 60 * 1000 * 60 * 24 + Date.now())
						await roleInfo.save()

						await interaction.member.roles.add('1027594002205257798')
						const Embed = new MessageEmbed()
							.setTitle(`Персональная комната — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Персональная** комната **создана!**`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					} else {
						const Embed = new MessageEmbed()
							.setTitle(`Персональная комната — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Недостаточно** койнов для **создания** персональной **комнаты!**`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
				case 'cancel': {
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **создание** персональной **комнаты!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
			}
		})

		setTimeout(() => collector.stop('timeout'), 10000)
		collector.on('end', async (i) => {
			if (initialInteraction && i.size == 0) {
				const Embed = new MessageEmbed()
					.setTitle(`Персональная комната — ${interaction.user.username}`)
					.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
					.setDescription(
						`<@${interaction.user.id}>, **Вы** отменили **создание** персональной **комнаты!**`,
					)
				initialInteraction.edit({
					embeds: [Embed],
					components: [],
				})
			}
		})
	},
}
