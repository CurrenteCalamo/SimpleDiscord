const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow } = require('discord.js')
const { MessageButton, MessageSelectMenu } = require('discord.js')
const User = require('../models/User')
const Product = require('../models/Product')

async function getProductList(offset, count, config) {
	const tmp = await Product.find({ tradable: true })
		.sort(JSON.parse(config))
		.skip(offset)
		.limit(count)
	return tmp.map((element, i) => {
		return {
			name: '\u200B',
			value: `**${offset + 1 + i})** Роль: <@&${element.roleId}>\nЦена: **${
				element.price
			}** койнов\nВладелец: <@${element.ownerId}>\nКуплена раз: **${
				element.count
			}**`,
			inline: false,
		}
	})
}
async function getProductButtons(offset, count, interaction, config) {
	const tmp = await Product.find({ tradable: true })
		.sort(JSON.parse(config))
		.skip(offset)
		.limit(count)
	return new MessageActionRow().addComponents(
		tmp.map((element, i) => {
			return new MessageButton()
				.setLabel(`${offset + i + 1}`)
				.setStyle('SUCCESS')
				.setCustomId(element.roleId)
				.setDisabled(element.terms.has(interaction.user.id))
		}),
	)
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Открыть магазин личных ролей'),
	async execute(interaction) {
		let role
		let roleInfo
		let option = '{}'
		let offset = 0
		const count = 5
		const length = Math.floor((await Product.count({ tradable: true })) / 5)
			? Math.floor((await Product.count({ tradable: true })) / 5) + 1
			: 1

		const Embed = new MessageEmbed()
			.setTitle(`Магазин личных ролей — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.addFields(...(await getProductList(offset, count, option)))
			.setFooter({ text: `${offset / 5 + 1}/${length}` })

		const options = [
			{
				label: 'Сначала дорогие',
				description: 'Создает приглашение на активность на YouTube Together',
				value: '{ "price": -1 }',
				emoji: '🃏',
			},
			{
				label: 'Сначала дешевые',
				description: 'Создает приглашение на мероприятие Poker Night',
				value: '{ "price": 1 }',
				emoji: '🃏',
			},
			{
				label: 'Сначала популярные',
				description: 'Создает приглашение на мероприятие Fishington.io',
				value: '{ "count": -1 }',
				emoji: '🃏',
			},
			{
				label: 'Сначала непопулярные',
				description: 'Создает приглашение на активность Betrayal.io',
				value: '{ "count": 1 }',
				emoji: '🃏',
			},
			{
				label: 'Сначала старые',
				description: 'Создает приглашение на занятие шахматами',
				value: '{}',
				emoji: '🃏',
			},
		]

		const Row = () =>
			new MessageActionRow().addComponents(
				new MessageSelectMenu()
					.setCustomId('row')
					.setPlaceholder(
						options.find((e) => {
							return e.value == option
						}).label,
					)
					.addOptions(options),
			)

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
				await getProductButtons(offset, count, interaction, option),
				Row(),
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
				case 'row': {
					option = i.values[0]
					const Embed = new MessageEmbed()
						.setTitle(`Магазин личных ролей — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...(await getProductList(offset, count, option)))
						.setFooter({ text: `${offset / 5 + 1}/${length}` })

					return await interaction.editReply({
						embeds: [Embed],
						components: [
							await getProductButtons(offset, count, interaction, option),
							Row(),
							Buttons,
						],
					})
				}
				case 'next': {
					offset += 5
					const Embed = new MessageEmbed()
						.setTitle(`Магазин личных ролей — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...(await getProductList(offset, count, option)))
						.setFooter({ text: `${offset / 5 + 1}/${length}` })

					return await interaction.editReply({
						embeds: [Embed],
						components: [
							await getProductButtons(offset, count, interaction, option),
							Row(),
							Buttons,
						],
					})
				}
				case 'last': {
					offset -= 5
					const Embed = new MessageEmbed()
						.setTitle(`Магазин личных ролей — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...(await getProductList(offset, count, option)))
						.setFooter({ text: `${offset / 5 + 1}/${length}` })

					return await interaction.editReply({
						embeds: [Embed],
						components: [
							await getProductButtons(offset, count, interaction, option),
							Row(),
							Buttons,
						],
					})
				}
				case 'purchase': {
					let user = await User.findOne({ userId: interaction.user.id })
					if (!user) {
						user = await User.create({ userId: interaction.user.id })
					}

					if (user.coins >= roleInfo.price) {
						const salesman = await User.findOne({ userId: roleInfo.ownerId })
						salesman.coins += Math.floor(
							(roleInfo.price *
								(100 - (salesman.commission ? salesman.commission : 100))) /
								100,
						)
						await salesman.save()

						user.coins -= roleInfo.price
						await user.save()

						roleInfo.count += 1
						roleInfo.terms.set(
							user.userId,
							7 * 60 * 1000 * 60 * 24 + Date.now(),
						)
						await roleInfo.save()

						await i.member.roles.add(role)
						const Embed = new MessageEmbed()
							.setTitle(`Купить роль в магазине — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** купили **роль** <@&${role.id}> на **7** дней!`,
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
								`<@${interaction.user.id}>, **Недостаточно** койнов **для** покупки **роли** <@&${role.id}>!`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
				case 'cancel': {
					const Embed = new MessageEmbed()
						.setTitle(`Купить роль в магазине — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **покупку** роли <@&${role.id}>.`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}

				case 'close': {
					collector.stop('timeout')
					break
				}
				default: {
					roleInfo = await Product.findOne({ roleId: i.customId })
					role = await interaction.guild.roles.cache.get(i.customId)

					const Embed = new MessageEmbed()
						.setTitle(`Купить роль в магазине — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** уверены, что **хотите** купить **роль** <@&${role.id}> за **${roleInfo.price}** койнов. **Роли** покупаются на **7** дней, **после** чего **вам** придется **купить** ее **заново!**`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancel'),
						new MessageButton()
							.setLabel('Купить')
							.setStyle('SUCCESS')
							.setCustomId('purchase'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
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
