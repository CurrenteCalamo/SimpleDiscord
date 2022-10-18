const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { getVoiceTimeStr, getRoleTimeStr } = require('../components.js')
const { getDateTimeStr } = require('../components.js')
const Love = require('../models/Love')
const Personal = require('../models/Personal')
const Product = require('../models/Product')
const User = require('../models/User')

async function getProductList(offset, count) {
	const tmp = await Product.find({ ownerId: '1008002556179529799' })
		.skip(offset)
		.limit(count)
	return tmp.map((element, i) => ({
		name: '\u200B',
		value: `**${offset + 1 + i})** <@&${element.roleId}> - цена **${
			element.price
		}** рублей\n${element.description}`,
		inline: false,
	}))
}

async function getProductButtons(offset, count) {
	const tmp = await Product.find({ ownerId: '1008002556179529799' })
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
		.setName('profile')
		.setDescription(
			'Получить профиль выбранного пользователя или свой собственный',
		)
		.addUserOption((option) =>
			option.setName('target').setDescription('Пользователь'),
		),
	async execute(interaction) {
		const target = interaction.options.getUser('target')

		if (target && target.id != interaction.user.id) {
			let user = await User.findOne({ userId: target.id })
			if (!user) {
				user = await User.create({ userId: target.id })
			}

			const Embed = new MessageEmbed()
				.setTitle(`Профиль пользователя — ${target.username}`)
				.setThumbnail(`${target.displayAvatarURL({ dynamic: false })}`)
				.addFields(
					{ name: 'Уровень:', value: `\`\`\`${user.lvl}\`\`\``, inline: true },
					{ name: 'Койнов:', value: `\`\`\`${user.coins}\`\`\``, inline: true },
					{
						name: 'Рублей:',
						value: `\`\`\`${user.rubles}\`\`\``,
						inline: true,
					},
					{
						name: 'Онлайн:',
						value: `\`\`\`${getVoiceTimeStr(user.allTime)}\`\`\``,
						inline: true,
					},
				)
			return await interaction.reply({
				embeds: [Embed],
			})
		}

		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		const Embed = new MessageEmbed()
			.setTitle(`Профиль пользователя — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.addFields(
				{ name: 'Уровень:', value: `\`\`\`${user.lvl}\`\`\``, inline: true },
				{ name: 'Койнов:', value: `\`\`\`${user.coins}\`\`\``, inline: true },
				{
					name: 'Рублей:',
					value: `\`\`\`${user.rubles}\`\`\``,
					inline: true,
				},
				{
					name: 'Онлайн:',
					value: `\`\`\`${getVoiceTimeStr(user.allTime)}\`\`\``,
					inline: true,
				},
			)
		const firstButtons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Персональная комната')
				.setStyle('PRIMARY')
				.setCustomId('personal')
				.setDisabled(!user.personalRoomId),
			new MessageButton()
				.setLabel('Любовный профиль')
				.setStyle('PRIMARY')
				.setCustomId('love')
				.setDisabled(!user.loveRoomId),
		)
		const secondButtons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Донат-Магазин')
				.setStyle('SECONDARY')
				.setCustomId('donate'),
			new MessageButton()
				.setLabel('Привелегии')
				.setStyle('PRIMARY')
				.setCustomId('privilege'),
			new MessageButton()
				.setLabel('Cancel')
				.setStyle('DANGER')
				.setCustomId('close'),
		)

		const initialInteraction = await interaction.reply({
			embeds: [Embed],
			components: [firstButtons, secondButtons],
			fetchReply: true,
		})
		const collector = initialInteraction.createMessageComponentCollector({})

		let role
		let roleInfo
		let personal
		let love
		collector.on('collect', async (i) => {
			if (i.user.id != interaction.user.id) return
			switch (i.customId) {
				case 'love': {
					love = await Love.findById(user.loveRoomId)

					const roleInfo = await Product.findOne({
						roleId: '1022547796781436948',
					})
					const spouse = await interaction.guild.members.cache.get(
						user.spouseId,
					)

					const condition = roleInfo.terms.get(interaction.user.id) < Date.now()
					const fields = [
						{
							name: ' Партнер:',
							value: `\`\`\`${spouse.user.tag}\`\`\``,
							inline: false,
						},
					]
					if (love.description) {
						fields.push({
							name: 'Описание:',
							value: `\`\`\`${love.description}\`\`\``,
							inline: false,
						})
					}
					if (love.allTime) {
						fields.push({
							name: 'Время вместе:',
							value: `\`\`\`${getVoiceTimeStr(love.allTime)}\`\`\``,
							inline: false,
						})
					}

					fields.push(
						{
							name: 'Койнов:',
							value: `\`\`\`${love.coins}\`\`\``,
							inline: true,
						},
						{
							name: 'Регистрация:',
							value: `\`\`\`${getDateTimeStr(love.date)}\`\`\``,
							inline: true,
						},
						{
							name: 'Продление:',
							value: `\`\`\`${getDateTimeStr(
								roleInfo.terms.get(interaction.user.id),
							)} \`\`\``,
							inline: true,
						},
					)

					let Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...fields)
					if (love.imageUrl) Embed = Embed.setImage(love.imageUrl)

					const firstButtons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Настройки')
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId('settingLove')
							.setDisabled(condition || love.ownerId != interaction.user.id),
						new MessageButton()
							.setLabel('Удалить банер')
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId('imageLove')
							.setDisabled(
								condition ||
									love.ownerId != interaction.user.id ||
									!Boolean(love.imageUrl),
							),
					)
					const secondButtons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Пополнить баланс')
							.setStyle(condition ? 'SUCCESS' : 'SECONDARY')
							.setCustomId('topUpLove'),
						new MessageButton()
							.setLabel('Развестись')
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId('deleteLove'),
						new MessageButton()
							.setLabel('Cancel')
							.setStyle(condition ? 'SECONDARY' : 'DANGER')
							.setCustomId('willreturn'),
					)

					return await interaction.editReply({
						embeds: [Embed],
						components: [firstButtons, secondButtons],
					})
				}
				case 'personal': {
					personal = await Personal.findById(user.personalRoomId)
					console.log(personal)
					const roleInfo = await Product.findOne({
						roleId: '1027594002205257798',
					})
					const condition = roleInfo.terms.get(interaction.user.id) < Date.now()

					const fields = [
						{
							name: 'Название:',
							value: `\`\`\`${personal.title}\`\`\``,
							inline: false,
						},
						{
							name: 'Койнов:',
							value: `\`\`\`${personal.coins}\`\`\``,
							inline: true,
						},
						{
							name: 'Участников:',
							value: `\`\`\`${personal.count}\`\`\``,
							inline: true,
						},
					]
					if (personal.allTime) {
						fields.push({
							name: 'Время вместе:',
							value: `\`\`\`${getVoiceTimeStr(personal.allTime)}\`\`\``,
							inline: false,
						})
					}
					if (personal.description) {
						fields.push({
							name: 'Описание:',
							value: `\`\`\`${personal.description}\`\`\``,
							inline: false,
						})
					}
					fields.push(
						{
							name: 'Регестрация:',
							value: `\`\`\`${getDateTimeStr(personal.date)}\`\`\``,
							inline: true,
						},
						{
							name: 'Продление:',
							value: `\`\`\`${getDateTimeStr(
								roleInfo.terms.get(interaction.user.id),
							)} \`\`\``,
							inline: true,
						},
					)
					let Embed = new MessageEmbed()
						.setTitle(`Приватная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...fields)
					if (personal.imageUrl) Embed = Embed.setImage(personal.imageUrl)

					const firstButtons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Настройки')
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId('settingPersonal')
							.setDisabled(
								condition || personal.ownerId != interaction.user.id,
							),
						new MessageButton()
							.setLabel('Удалить банер')
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId('imagePersonal')
							.setDisabled(
								condition ||
									personal.ownerId != interaction.user.id ||
									!Boolean(personal.imageUrl),
							),
						new MessageButton()
							.setLabel('Выгнать пользователя')
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId('kickUser')
							.setDisabled(
								condition || personal.ownerId != interaction.user.id,
							),
					)
					const secondButtons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Пополнить баланс')
							.setStyle(condition ? 'SUCCESS' : 'SECONDARY')
							.setCustomId('topUpPersonal'),
						new MessageButton()
							.setLabel(
								personal.ownerId == interaction.user.id
									? 'Удалить комнату'
									: 'Покинуть комнату',
							)
							.setStyle(condition ? 'SECONDARY' : 'PRIMARY')
							.setCustomId(
								personal.ownerId == interaction.user.id
									? 'deletePersonal'
									: 'abandonPersonal',
							),
						new MessageButton()
							.setLabel('Cancel')
							.setStyle(condition ? 'SECONDARY' : 'DANGER')
							.setCustomId('willreturn'),
					)

					return await interaction.editReply({
						embeds: [Embed],
						components: [firstButtons, secondButtons],
					})
				}
				case 'abandonPersonal': {
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** действительно **хотите** покинуть персональную **комнату?**`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancelPersonal'),
						new MessageButton()
							.setLabel('Покинуть')
							.setStyle('SUCCESS')
							.setCustomId('createAbandonPersonal'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'createAbandonPersonal': {
					user.personalRoomId = ''
					personal.count -= 1
					await personal.save()
					await user.save()
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** покинули персональную **комнату!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}

				case 'imagePersonal': {
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** действительно **хотите** удалить **банер** персональной **комнаты?**`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancelPersonal'),
						new MessageButton()
							.setLabel('Удалить')
							.setStyle('SUCCESS')
							.setCustomId('deleteImagePersonal'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'imageLove': {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** действительно **хотите** удалить **банер** любовного **профиля?**`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancelLove'),
						new MessageButton()
							.setLabel('Удалить')
							.setStyle('SUCCESS')
							.setCustomId('deleteImageLove'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'deleteImagePersonal': {
					personal.imageUrl = ''
					await personal.save()
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** удалили **банер** персональной **комнаты!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'deleteImageLove': {
					love.imageUrl = ''
					await love.save()
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** удалили **банер** любовного **профиля!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'deletePersonal': {
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** действительно **хотите** удалить персональную **комнату?**`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancelPersonal'),
						new MessageButton()
							.setLabel('Удалить')
							.setStyle('SUCCESS')
							.setCustomId('removePersonal'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'deleteLove': {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** действительно **хотите** удалить любовный **профиль?**`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('cancelLove'),
						new MessageButton()
							.setLabel('Удалить')
							.setStyle('SUCCESS')
							.setCustomId('removeLove'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'removePersonal': {
					const users = await User.find({ personalRoomId: personal.id })
					users.forEach(async (e) => {
						const roleInfo = await Product.findOne({
							roleId: '1027594002205257798',
						})
						roleInfo.terms.delete(e.userId)
						e.personalRoomId = ''

						const member = await interaction.guild.members.cache.get(e.userId)
						if (member._roles.includes(roleInfo.roleId)) {
							member.roles.remove(roleInfo.roleId)
						}

						await e.save()
						await roleInfo.save()
					})
					await personal.delete()

					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** удалили персональную **комнату!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'removeLove': {
					const users = await User.find({ loveRoomId: love.id })
					users.forEach(async (e) => {
						const roleInfo = await Product.findOne({
							roleId: '1022547796781436948',
						})
						roleInfo.terms.delete(e.userId)
						e.loveRoomId = ''
						e.spouseId = ''
						const member = await interaction.guild.members.cache.get(e.userId)
						if (member._roles.includes(roleInfo.roleId)) {
							member.roles.remove(roleInfo.roleId)
						}

						await e.save()
						await roleInfo.save()
					})
					await love.delete()

					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** удалили любовный **профиль!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'cancelPersonal': {
					const Embed = new MessageEmbed()
						.setTitle(`Персональная комната — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **действие** с персональной **комнатой!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'cancelLove': {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **действие** с любовным **профилем!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'topUpPersonal': {
					collector.stop('timeout')
					break
				}
				case 'topUpLove': {
					collector.stop('timeout')
					break
				}
				case 'settingPersonal': {
					collector.stop('timeout')
					break
				}
				case 'settingLove': {
					collector.stop('timeout')
					break
				}
				case 'close': {
					collector.stop('timeout')
					break
				}
				case 'willreturn': {
					return await interaction.editReply({
						embeds: [Embed],
						components: [firstButtons, secondButtons],
					})
				}
				case 'donate': {
					collector.stop('timeout')
					break
				}
				case 'kickUser': {
					collector.stop('timeout')
					break
				}
				case 'privilege': {
					let offset = 0
					const count = 5

					const Embed = new MessageEmbed()
						.setTitle(`Особые привилегии на сервере`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.addFields(...(await getProductList(offset, count)))

					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Назад')
							.setStyle('SECONDARY')
							.setCustomId('willreturn'),
						new MessageButton()
							.setLabel('Донат-Магазин')
							.setStyle('SECONDARY')
							.setCustomId('donate'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [await getProductButtons(offset, count), Buttons],
					})
				}
				case 'buy': {
					const Embed = new MessageEmbed()
						.setTitle(`Покупка роли — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** уверены, что **хотите** купить роль <@&${role.id}> за **${roleInfo.price}** рублей.`,
						)
					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Отмена')
							.setStyle('DANGER')
							.setCustomId('not'),
						new MessageButton()
							.setLabel('Купить')
							.setStyle('SUCCESS')
							.setCustomId('yes'),
					)
					return await interaction.editReply({
						embeds: [Embed],
						components: [Buttons],
					})
				}
				case 'yes': {
					if (user.rubles >= roleInfo.price) {
						if (user.privilege != 0) {
							const roleToRemove = await Product.findOne({
								privilege: user.privilege,
							})
							if (interaction.member._roles.includes(roleToRemove.roleId)) {
								interaction.member.roles.remove(roleToRemove.roleId)
							}
							roleToRemove.terms.delete(interaction.user.id)
							await roleToRemove.save()
						}

						roleInfo.count += 1
						roleInfo.terms.set(
							interaction.user.id,
							Date.now() + 12 * 30 * 60 * 1000 * 60 * 24,
						)
						user.privilege = roleInfo.privilege
						user.rubles -= roleInfo.price
						if (user.commission > roleInfo.commission)
							user.commission = roleInfo.commission
						if (user.multiplier < roleInfo.multiplier)
							user.multiplier = roleInfo.multiplier

						await user.save()
						await roleInfo.save()
						await interaction.member.roles.add(role)
						const Embed = new MessageEmbed()
							.setTitle(`Покупка роли — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** купили **роль** <@&${role.id}>`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					} else {
						const Embed = new MessageEmbed()
							.setTitle(`Покупка роли — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Недостаточно** рублей для **покупки** роли <@&${role.id}>.`,
							)
						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
				case 'not': {
					const Embed = new MessageEmbed()
						.setTitle(`Покупка роли — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** отменили **покупку** роли <@&${role.id}>`,
						)

					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				default: {
					roleInfo = await Product.findOne({ roleId: i.customId })
					role = await interaction.guild.roles.cache.get(i.customId)
					const count = role.members.map((m) => m.user.id).length
					let color = String(role.color.toString(16))
					while (color.length != 6) {
						color = '0'.concat(color)
					}
					const condition = !(user.privilege < roleInfo.privilege)

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

					const Buttons = new MessageActionRow().addComponents(
						new MessageButton()
							.setLabel('Назад')
							.setStyle('DANGER')
							.setCustomId('privilege'),
						new MessageButton()
							.setLabel('Купить')
							.setStyle('SUCCESS')
							.setCustomId('buy')
							.setDisabled(condition),
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
