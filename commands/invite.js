const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const User = require('../models/User')
const Personal = require('../models/Personal')
const Product = require('../models/Product')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Создать приглашения в личную комнату')
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

		let recipient = await User.findOne({ userId: target.id })
		if (!recipient) {
			recipient = await User.create({ userId: target.id })
		}

		let personal = await Personal.findById(user.personalRoomId)

		if (!user.personalRoomId) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Вы** не **состоите** в персональной **комнате!**`,
				ephemeral: true,
			})
		}

		if (recipient.personalRoomId) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Пользователь** <@${target.id}> уже **состоит** в персональной  **комнате!**`,
				ephemeral: true,
			})
		}

		if (user.userId != personal.ownerId) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Вы** не **можете** создавать **приглашения!**`,
				ephemeral: true,
			})
		}

		if (personal.count == 20) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Превышен** придел **участников!**`,
				ephemeral: true,
			})
		}
		const Embed = new MessageEmbed()
			.setTitle(`Создание приглашения — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${interaction.user.id}>, **Вы** уверены, **что** хотите **создать** приграшение для **пользователя** <@${target.id}>?`,
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
						const Embed = new MessageEmbed()
							.setTitle(`Персональная комната — ${interaction.user.username}`)
							.setThumbnail(target.displayAvatarURL({ dynamic: false }))
							.setDescription(
								`<@${target.id}>, **Пользователь** <@${interaction.user.id}> предлагает **вам** вступить в **${personal.title}**`,
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
					}
					case 'cancel': {
						const Embed = new MessageEmbed()
							.setTitle(`Персональная комната — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** отменили **создание** приглашения.`,
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
						recipient.personalRoomId = user.personalRoomId
						await recipient.save()
						personal.count += 1
						await personal.save()
						let roleInfo = await Product.findOne({
							roleId: '1027594002205257798',
						})
						roleInfo.terms.set(i.user.id, roleInfo.terms.get(personal.ownerId))
						await roleInfo.save()

						await i.member.roles.add(roleInfo.roleId)
						const Embed = new MessageEmbed()
							.setTitle(`Персональная комната — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Пользователь** <@${i.user.id}> принял **приглашение!**`,
							)

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
					case 'decline': {
						const Embed = new MessageEmbed()
							.setTitle(`Персональная комната — ${interaction.user.username}`)
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

		setTimeout(() => collector.stop('timeout'), 10000)
		collector.on('end', async (i) => {
			initialInteraction.edit({
				components: [],
			})
		})
	},
}
