const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const User = require('../models/User')
const { ComponentType } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('send')
		.setDescription('Перевести койны выбранному пользователю')
		.addUserOption((option) =>
			option.setName('target').setDescription('Пользователь').setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setMinValue(50)
				.setName('amount')
				.setDescription('Сумма перевода')
				.setRequired(true),
		),
	async execute(interaction) {
		const target = interaction.options.getUser('target')
		const amount = interaction.options.getInteger('amount')

		if (target.id == interaction.user.id) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Пожалуйста** заполните **все** поля **корректно!**`,
				ephemeral: true,
			})
		}

		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		const reward = Math.floor(
			(amount * (100 - (user.commission ? user.commission : 100))) / 100,
		)

		const Embed = new MessageEmbed()
			.setTitle(`Перевод койнов  — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${
					interaction.user.id
				}>, **Вы** уверены, **что** хотите **перевести** <@${
					target.id
				}> **${reward}** койнов?${
					user.commission ? ` **Включая** комиссию **${user.commission}%**` : ''
				}`,
			)

		const Buttons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Отмена')
				.setStyle('DANGER')
				.setCustomId('cancel'),
			new MessageButton()
				.setLabel('Перевести')
				.setStyle('SUCCESS')
				.setCustomId('transfer'),
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
				case 'transfer': {
					if (user.coins >= amount) {
						let recipient = await User.findOne({ userId: target.id })
						if (!recipient) {
							recipient = await User.create({ userId: target.id })
						}

						recipient.coins += reward
						await recipient.save()
						user.coins -= amount
						await user.save()

						const Embed = new MessageEmbed()
							.setTitle(`Перевод койнов  — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** перевели <@${
									target.id
								}> **${reward}** койнов?${
									user.commission
										? ` **Включая** комиссию **${user.commission}%**`
										: ''
								}`,
							)

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					} else {
						const Embed = new MessageEmbed()
							.setTitle(`Купить роль в магазине — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Недостаточно** койнов для **перевода!**`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
				case 'cancel': {
					const Embed = new MessageEmbed()
						.setTitle(`Перевод койнов  — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **перевод!**`,
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
					.setTitle(`Перевод койнов  — ${interaction.user.username}`)
					.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
					.setDescription(
						`<@${interaction.user.id}>, **Вы** отменили **перевод!**`,
					)
				initialInteraction.edit({
					embeds: [Embed],
					components: [],
				})
			}
		})
	},
}
