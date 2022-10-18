const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const User = require('../models/User')
const Love = require('../models/Love')
const Product = require('../models/Product')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('marry')
		.setDescription('Создание брака')
		.addUserOption((option) =>
			option.setName('target').setDescription('Пользователь').setRequired(true),
		),
	async execute(interaction) {
		const target = interaction.options.getUser('target')

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

		let spouse = await User.findOne({ userId: target.id })
		if (!spouse) {
			spouse = await User.create({ userId: target.id })
		}

		if (user.loveRoomId) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Вы** уже **состоите** в **браке!**`,
				ephemeral: true,
			})
		}

		if (spouse.loveRoomId) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Пользователь** <@${target.id}> уже **состоит** в **браке!**`,
				ephemeral: true,
			})
		}

		const Embed = new MessageEmbed()
			.setTitle('Создание брака')
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${interaction.user.id}>, **Вы** уверены, что **хотите** создать **брак** с <@${target.id}> за **5000** койнов?`,
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
			return i.user.id == interaction.user.id || i.user.id == target.id
		}
		const collector = initialInteraction.createMessageComponentCollector({
			filter,
			time: 20000,
		})
		collector.on('collect', async (i) => {
			if (i.user.id == interaction.user.id) {
				switch (i.customId) {
					case 'create': {
						if (user.coins >= 5000) {
							const Embed = new MessageEmbed()
								.setTitle(`Создание брака — ${interaction.user.username}`)
								.setThumbnail(target.displayAvatarURL({ dynamic: false }))
								.setDescription(
									`<@${target.id}>, **Пользователь** <@${interaction.user.id}> предлагает **вам** стать **парой** `,
								)

							const Buttons = new MessageActionRow().addComponents(
								new MessageButton()
									.setLabel('Отклонить')
									.setStyle('DANGER')
									.setCustomId('decline'),
								new MessageButton()
									.setLabel('Вступить')
									.setStyle('SUCCESS')
									.setCustomId('accept'),
							)

							return await interaction.editReply({
								embeds: [Embed],
								components: [Buttons],
							})
						} else {
							const Embed = new MessageEmbed()
								.setTitle(`Создание брака — ${interaction.user.username}`)
								.setThumbnail(
									interaction.user.displayAvatarURL({ dynamic: false }),
								)
								.setDescription(
									`<@${interaction.user.id}>, **Недостаточно** койнов **для** создания **брака!**`,
								)
							return await interaction.editReply({
								embeds: [Embed],
								components: [],
							})
						}
					}
					case 'cancel': {
						const Embed = new MessageEmbed()
							.setTitle(`Создание брака — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** отменили создание **брака!**`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
			}
			if (i.user.id == target.id) {
				switch (i.customId) {
					case 'accept': {
						const loveRoom = await Love.create({ ownerId: interaction.user.id })

						user.money -= 5000
						user.spouseId = i.member.id
						user.loveRoomId = loveRoom.id
						await user.save()

						spouse.spouseId = interaction.member.id
						spouse.loveRoomId = loveRoom.id
						await spouse.save()

						const roleInfo = await Product.findOne({
							roleId: '1022547796781436948',
						})
						const term = 30 * 60 * 1000 * 60 * 24 + Date.now()
						roleInfo.terms.set(i.user.id, term)
						roleInfo.terms.set(interaction.user.id, term)
						await roleInfo.save()
						await interaction.member.roles.add(roleInfo.roleId)
						await i.member.roles.add(roleInfo.roleId)

						const Embed = new MessageEmbed()
							.setTitle(`Создание брака — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Пара** с <@${i.user.id}> **создана!**`,
							)

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
					case 'decline': {
						const Embed = new MessageEmbed()
							.setTitle(`Создание брака — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** получили **отказ!**`,
							)

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
			}
		})

		setTimeout(() => collector.stop('timeout'), 20000)
		collector.on('end', async (i) => {
			initialInteraction.edit({
				components: [],
			})
		})
	},
}
