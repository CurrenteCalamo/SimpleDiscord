const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const User = require('../models/User')
const Product = require('../models/Product')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Создать личную роль')
		.addStringOption((option) =>
			option
				.setName('color')
				.setDescription('Цвет вашей личной роли в формате #ffffff')
				.setRequired(true)
				.setAutocomplete(true),
		)
		.addStringOption((option) =>
			option
				.setName('title')
				.setDescription('Название вашей личной роли')
				.setRequired(true)
				.setAutocomplete(true),
		),
	async execute(interaction) {
		const title = interaction.options.getString('title')
		const color = interaction.options.getString('color')

		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		if (title.length > 100) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Название** личной **роли** не **должно** привышать **100** символов!`,
				ephemeral: true,
			})
		}
		if (interaction.guild.roles.cache.find((role) => role.name == title)) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Роль** с **таким** названием **существует!**`,
				ephemeral: true,
			})
		}
		if (
			!(
				color.startsWith('#') &&
				color.length == 7 &&
				/^[0-9a-f#]+$/.test(color)
			)
		) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Неправильно** указан **цвет** пример \`#ffffff\``,
				ephemeral: true,
			})
		}

		const role = await interaction.guild.roles.create({
			name: title,
			color: color,
			permissions: [],
		})

		const Embed = new MessageEmbed()
			.setTitle(`Создать личную роль — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${interaction.user.id}>, **Вы** уверены, **что** хотите **создать** личную **роль** <@&${role.id}> за **5000** койнов?`,
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
			time: 20000,
		})

		collector.on('collect', async (i) => {
			if (i.user.id != interaction.user.id) return

			switch (i.customId) {
				case 'create': {
					if (user.coins >= 5000) {
						await i.member.roles.add(role)

						user.coins -= 5000
						await user.save()

						await Product.create({
							ownerId: interaction.user.id,
							roleId: role.id,
							terms: new Map([
								[i.user.id, Date.now() + 6 * 30 * 60 * 1000 * 60 * 24],
							]),
						})

						const Embed = new MessageEmbed()
							.setTitle(`Создать личную роль — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Личная** роль <@&${role.id}> **создана!**`,
							)

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					} else {
						await role.delete()
						const Embed = new MessageEmbed()
							.setTitle(`Создать личную роль — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>,  **Недостаточно** койнов **для** создание **роли!**`,
							)
						return interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
				case 'cancel': {
					await role.delete()
					const Embed = new MessageEmbed()
						.setTitle(`Создать личную роль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>,  **Вы** отменили **создание** роли!`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
			}
		})

		setTimeout(() => {
			collector.stop('timeout')
		}, 20000)
		collector.on('end', async (i) => {
			if (initialInteraction && i.size == 0) {
				await role.delete()
				const Embed = new MessageEmbed()
					.setTitle(`Создать личную роль — ${interaction.user.username}`)
					.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
					.setDescription(
						`<@${interaction.user.id}>, **Вы** отменили **создание** роли!`,
					)
				initialInteraction.edit({
					embeds: [Embed],
					components: [],
				})
			}
		})
	},
}
