const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { getRoleTimeStr } = require('../components.js')
const Product = require('../models/Product')

async function getProductList(offset, count, interaction) {
	const tmp = await Product.find({
		[`terms.` + interaction.user.id]: { $gte: Date.now() },
	})
		.skip(offset)
		.limit(count)

	let member
	const roles = interaction.member._roles
	return tmp.map((element, i) => {
		member = interaction.guild.members.cache.get(element.ownerId)
		return {
			name: '\u200B',
			value: `**${offset + 1 + i})** <@&${element.roleId}>\n${
				roles.includes(element.roleId) ? '[Активна]' : '[Скрыта]'
			}${
				element.ownerId == interaction.user.id && element.tradable
					? '[Продается]'
					: ''
			}${element.ownerId == interaction.user.id ? '' : '[Куплена]'}[${
				member.user.tag
			}]`,
			inline: false,
		}
	})
}

async function getProductButtons(offset, count, interaction) {
	const tmp = await Product.find({
		[`terms.` + interaction.user.id]: { $gte: Date.now() },
	})
		.skip(offset)
		.limit(count)
	return new MessageActionRow().addComponents(
		tmp.map((element, i) => {
			return new MessageButton()
				.setLabel(`${offset + i + 1}`)
				.setStyle('SUCCESS')
				.setCustomId(element.roleId)
		}),
	)
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Получить информацию o роли')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('info')
				.setDescription('Получить информацию о роли')
				.addRoleOption((option) =>
					option.setName('role').setDescription('Выберите роль'),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('manage').setDescription('Управление личными ролями'),
		),
	async execute(interaction) {
		let role = interaction.options.getRole('role')
		let roleInfo
		let disable
		if (role) {
			roleInfo = await Product.findOne({ roleId: role.id })

			let color = String(role.color.toString(16))
			while (color.length != 6) {
				color = '0'.concat(color)
			}
			const count = role.members.map((m) => m.user.id).length

			const Embed = new MessageEmbed()
				.setTitle('Посмотреть информацию о роли')
				.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
				.setDescription(
					`Роль: <@&${role.id}>\nВладелец: <@${roleInfo.ownerId}>\n${
						roleInfo.count ? `Продана раз: **${roleInfo.count}**\n` : ''
					}Активна: **${count}**\nСкрыта: **${roleInfo.terms.size - count}**\n${
						roleInfo.description ? `Описание :\n${roleInfo.description}\n` : ''
					}\n\n\nID роли: **${role.id}**\nЦвет роли: **#${color}**\n${
						roleInfo.terms.has(roleInfo.ownerId) &&
						interaction.user.id == roleInfo.ownerId
							? 'Действует до: ' +
							  `**${getRoleTimeStr(roleInfo.terms.get(roleInfo.ownerId))}**\n`
							: ''
					}${
						roleInfo.terms.has(interaction.user.id) &&
						!(interaction.user.id == roleInfo.ownerId)
							? 'Куплена до: ' +
							  `**${getRoleTimeStr(roleInfo.terms.get(interaction.user.id))}**`
							: ''
					}`,
				)

			return await interaction.reply({
				embeds: [Embed],
				components: [],
			})
		}

		if (
			!(await Product.count({
				[`terms.` + interaction.user.id]: { $gte: Date.now() },
			}))
		) {
			const Embed = new MessageEmbed()
				.setTitle(`Личные роли = ${interaction.user.username}`)
				.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
				.setDescription(
					`<@${interaction.user.id}>, **У** вас нет личных **ролей**`,
				)

			return await interaction.reply({
				embeds: [Embed],
				components: [],
			})
		}

		let offset = 0
		const count = 5
		const length = Math.floor(
			(await Product.count({
				[`terms.` + interaction.user.id]: { $gte: Date.now() },
			})) / 5,
		)
			? Math.floor(
					(await Product.count({ ownerId: interaction.user.id })) / 5,
			  ) + 1
			: 1

		const Embed = new MessageEmbed()
			.setTitle(`Личные роли — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.addFields(...(await getProductList(offset, count, interaction)))
			.setFooter({ text: `${offset / 5 + 1}/${length}` })
		const Buttons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Last')
				.setStyle('SECONDARY')
				.setCustomId('last')
				.setDisabled(offset / 5 + 1 == 1),
			new MessageButton()
				.setLabel('Next')
				.setStyle('SECONDARY')
				.setCustomId('next')
				.setDisabled(offset / 5 + 1 == length),
			new MessageButton()
				.setLabel('Close')
				.setStyle('DANGER')
				.setCustomId('close'),
		)
		const initialInteraction = await interaction.reply({
			embeds: [Embed],
			components: [
				await getProductButtons(offset, count, interaction),
				Buttons,
			],
			fetchReply: true,
		})

		const filter = (i) => {
			i.deferUpdate()
			return i.user.id == interaction.user.id
		}
		const collector = initialInteraction.createMessageComponentCollector({
			filter,
			time: 40000,
		})
		collector.on('collect', async (i) => {
			switch (i.customId) {
				case 'next': {
					offset += 5
					const Embed = new MessageEmbed()
						.setTitle(`Личные роли — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...(await getProductList(offset, count, interaction)))
						.setFooter({ text: `${offset / 5 + 1}/${length}` })

					return await interaction.editReply({
						embeds: [Embed],
						components: [
							await getProductButtons(offset, count, interaction),
							Buttons,
						],
					})
				}
				case 'last': {
					offset -= 5
					const Embed = new MessageEmbed()
						.setTitle(`Личные роли — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...(await getProductList(offset, count, interaction)))
						.setFooter({ text: `${offset / 5 + 1}/${length}` })

					return await interaction.editReply({
						embeds: [Embed],
						components: [
							await getProductButtons(offset, count, interaction),
							Buttons,
						],
					})
				}
				case 'hide': {
					const Embed = new MessageEmbed()
						.setTitle(`Управление ролью — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** уверены, что **хотите** ${
								disable ? 'скрыть' : 'надеть'
							} надеть **роль** <@&${role.id}>?`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancel'),
						new MessageButton()
							.setLabel('Скрыть')
							.setStyle('SUCCESS')
							.setCustomId('createHide'),
					)

					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'createHide': {
					if (disable) await i.member.roles.remove(role)
					else await i.member.roles.add(role)
					const Embed = new MessageEmbed()
						.setTitle(`Управление ролью — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** ${
								disable ? 'скрыли' : 'надели'
							} **роль** <@&${role.id}>!`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'withdraw': {
					const Embed = new MessageEmbed()
						.setTitle(`Управление ролью — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Снять** лот в **магазине** <@&${role.id}>?`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancel'),
						new MessageButton()
							.setLabel('Cнять лот')
							.setStyle('SUCCESS')
							.setCustomId('createWithdraw'),
					)

					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'createWithdraw': {
					roleInfo.tradable = false
					await roleInfo.save()
					const Embed = new MessageEmbed()
						.setTitle(`Управление ролью — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** сняли **лот** <@&${role.id}> с **продажи!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}

				case 'cancel': {
					const Embed = new MessageEmbed()
						.setTitle(`Управление ролью — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **действие** с **ролью** <@&${role.id}>?`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'willreturn': {
					return await interaction.editReply({
						embeds: [Embed],
						components: [
							await getProductButtons(offset, count, interaction),
							Buttons,
						],
					})
				}
				case 'close': {
					collector.stop('timeout')
					break
				}
				default: {
					roleInfo = await Product.findOne({ roleId: i.customId })
					role = await interaction.guild.roles.cache.get(i.customId)
					disable = interaction.member._roles.includes(i.customId)

					let color = String(role.color.toString(16))
					while (color.length != 6) color = '0'.concat(color)
					const count = role.members.map((m) => m.user.id).length

					const Embed = new MessageEmbed()
						.setTitle('Посмотреть информацию о роли')
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`Роль: <@&${role.id}>\nВладелец: <@${roleInfo.ownerId}>\n${
								roleInfo.count ? `Продана раз: **${roleInfo.count}**\n` : ''
							}Активна: **${count}**\nСкрыта: **${
								roleInfo.terms.size - count
							}**\n${
								roleInfo.description
									? `Описание :\n${roleInfo.description}\n`
									: ''
							}\n\n\nID роли: **${role.id}**\nЦвет роли: **#${color}**\n${
								roleInfo.terms.has(roleInfo.ownerId) &&
								interaction.user.id == roleInfo.ownerId
									? 'Действует до: ' +
									  `**${getRoleTimeStr(
											roleInfo.terms.get(roleInfo.ownerId),
									  )}**\n`
									: ''
							}${
								roleInfo.terms.has(interaction.user.id) &&
								!(interaction.user.id == roleInfo.ownerId)
									? 'Куплена до: ' +
									  `**${getRoleTimeStr(
											roleInfo.terms.get(interaction.user.id),
									  )}**`
									: ''
							}`,
						)
					if (interaction.user.id == roleInfo.ownerId && roleInfo.tradable) {
						const Buttons = new MessageActionRow().addComponents(
							new MessageButton()
								.setLabel('Назад')
								.setStyle('SECONDARY')
								.setCustomId('willreturn'),
							new MessageButton()
								.setLabel(disable ? 'Скрыть' : 'Надеть')
								.setStyle('PRIMARY')
								.setCustomId('hide'),
							new MessageButton()
								.setLabel('Снять лот')
								.setStyle('PRIMARY')
								.setCustomId('withdraw'),
						)
						return await interaction.editReply({
							embeds: [Embed],
							components: [Buttons],
						})
					} else {
						const Buttons = new MessageActionRow().addComponents(
							new MessageButton()
								.setLabel('Назад')
								.setStyle('SECONDARY')
								.setCustomId('willreturn'),
							new MessageButton()
								.setLabel(disable ? 'Скрыть' : 'Надеть')
								.setStyle('PRIMARY')
								.setCustomId('hide'),
						)
						return await interaction.editReply({
							embeds: [Embed],
							components: [Buttons],
						})
					}
				}
			}
		})

		setTimeout(() => collector.stop('timeout'), 40000)
		collector.on('end', async (i) => {
			return await initialInteraction.edit({
				components: [],
			})
		})
	},
}
