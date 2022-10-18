const User = require('./models/User')
const Love = require('./models/Love')
const Guild = require('./models/Guild')
const Personal = require('./models/Personal')
const Product = require('./models/Product')
const { SlashCommandRoleOption } = require('@discordjs/builders')

const {
	Modal,
	TextInputComponent,
	MessageActionRow,
	MessageEmbed,
} = require('discord.js')
async function getRandomRoom(oM, nM) {
	if (nM.channel && nM.channelId == '969992585575804951') {
		const channel = await oM.guild.channels.cache.find(
			(channel) => channel.name == `Call ${[Math.floor(Math.random() * 49)]}`,
		)
		return await nM.setChannel(channel)
	}
}

async function setVoiceTime(oM, nM) {
	if (!oM.channel && nM.channel) {
		const uid = nM.member.id
		let user = await User.findOne({ userId: uid })
		if (!user) {
			user = await User.create({ userId: uid })
		}
		if (!user.tmpTime) {
			user.tmpTime = Date.now()
			await user.save()
		}

		let todayTime = new Date().getDate()
		if (user.lastTime != 1 && todayTime == 1) {
			user.lastTime = 0
		}
		if (user.lastTime < todayTime) {
			user.dayTime = 0
			user.lastTime = todayTime
			await user.save()
		}
	} else if (!nM.channel) {
		const uid = oM.member.id
		let user = await User.findOne({ userId: uid })
		if (!user) {
			user = await User.create({ userId: uid })
		}
		if (user.tmpTime) {
			let time = Date.now() - user.tmpTime
			user.tmpTime = 0
			user.allTime += time
			user.dayTime += time
			await user.save()
		}
	}
}

async function setLevelRole(message, user, roleToGive, roleToRemove) {
	if (message.member._roles.find((i) => i == roleToRemove)) {
		message.member.roles.remove(roleToRemove)
	}
	if (roleToRemove) {
		const role = await Product.findOne({ roleId: roleToRemove })
		role.terms.delete(message.author.id)
		role.save()
	}
	if (!message.member._roles.find((i) => i == roleToGive)) {
		const role = await Product.find({
			roleId: roleToGive,
		})

		if (user.commission > role.commission) user.commission = role.commission
		if (user.multiplier < role.multiplier) user.multiplier = role.multiplier

		role.terms.set(message.author.id, Date.now())
		await user.save()
		await role.save()

		message.member.roles.add(roleToGive)
		message.channel.send({
			content: `<@${message.author.id}>, Ты поднял(-а) уровень! Теперь ты <@&${roleToGive}>`,
			ephemeral: true,
		})
	}
}

async function setUserLvl(message) {
	let user = await User.findOne({ userId: message.author.id })
	if (!user) {
		user = await User.create({ userId: message.author.id })
	}

	user.xp += 1
	if (user.xp == 30) {
		user.xp = 0
		user.lvl += 1
	}

	await user.save()

	switch (user.lvl) {
		case 1: {
			if (user.xp == 0) await setLevelRole(message, user, '974343451678244904')
			break
		}
		case 5: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974343448930959390',
					'974343451678244904',
				)
			break
		}
		case 25: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974343445491621889',
					'974343448930959390',
				)
			break
		}
		case 50: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974343442656272494',
					'974343445491621889',
				)
			break
		}
		case 100: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974343439284052087',
					'974343442656272494',
				)
			break
		}
		case 250: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974342727514849290',
					'974343439284052087',
				)
			break
		}
		case 500: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974342721630249021',
					'974342727514849290',
				)
			break
		}
		case 1000: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974342141230845973',
					'974342721630249021',
				)
			break
		}
		case 2500: {
			if (user.xp == 0)
				await setLevelRole(
					message,
					user,
					'974340757198630952',
					'974342141230845973',
				)
			break
		}
	}
}

async function getLoveRoom(oldState, newState) {
	let data = await Guild.findOne({ guildId: newState.guild.id })
	let user = await User.findOne({ userId: newState.member.user.id })
	if (!user.loveRoomId) {
		return
	}
	// const roleInfo = await Product.findOne({
	// 	roleId: '1027594002205257798',
	// })
	// const condition = roleInfo.terms.get(user.userId) < Date.now()

	// if (!user || !user.loveRoomId || condition) {
	// 	newState.disconnect()
	// }

	let room = await Love.findById(user.loveRoomId)
	let channelId = await data?.love_voices?.channelId
	let categoryId = await data?.love_voices?.categoryId
	if (
		oldState.channel?.id !== data?.love_voices?.channelId &&
		oldState.channel?.parent?.id == data?.love_voices?.categoryId &&
		oldState.channel?.members.size === 0
	) {
		oldState.channel.delete()
		await Love.findByIdAndUpdate(room.id, {
			$set: {
				'love_voices.voiceId': null,
				'love_voices.lock': true,
			},
		})
	}
	if (data?.love_voices?.mode === true) {
		if (newState.channel?.id == channelId) {
			if (!room.love_voices.voiceId) {
				newState.guild.channels
					.create(room.title, {
						type: 'GUILD_VOICE',
						parent: categoryId,
						permissionOverwrites: [
							{
								id: newState.member.id,
								allow: ['MANAGE_CHANNELS', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS'],
							},
							{
								id: newState.guild.id,
								deny: ['MANAGE_CHANNELS'],
							},
						],
					})
					.then(async (channel) => {
						await Love.findByIdAndUpdate(room.id, {
							$set: {
								'love_voices.voiceId': channel.id,
							},
						})
						newState.setChannel(channel)
					})
			} else {
				if (!room.tmpTime) {
					room.tmpTime = Date.now()
					await room.save()
				}
				newState.setChannel(room.love_voices.voiceId)
			}
		}
	}
}

async function getPersonalRoom(oldState, newState) {
	let data = await Guild.findOne({ guildId: newState.guild.id })
	let user = await User.findOne({ userId: newState.member.user.id })
	if (!user.personalRoomId) {
		return
	}
	// const roleInfo = await Product.findOne({
	// 	roleId: '1027594002205257798',
	// })
	// const condition = roleInfo.terms.get(user.userId) < Date.now()

	// if (!user || !user.personalRoomId || condition) {
	// 	newState.disconnect()
	// }

	let room = await Personal.findById(user.personalRoomId)
	let channelId = await data?.personal_voices?.channelId
	let categoryId = await data?.personal_voices?.categoryId
	if (
		oldState.channel?.id !== data?.personal_voices?.channelId &&
		oldState.channel?.parent?.id == data?.personal_voices?.categoryId &&
		oldState.channel?.members.size === 0
	) {
		if (room.tmpTime) {
			const time = Date.now() - room.tmpTime
			room.allTime += time
			room.save()
		}
		oldState.channel.delete()
		await Personal.findByIdAndUpdate(room.id, {
			$set: {
				'personal_voices.voiceId': null,
				'personal_voices.lock': true,
				tmpTime: 0,
			},
		})
	}
	if (data?.personal_voices?.mode === true) {
		if (newState.channel?.id == channelId) {
			if (!room.personal_voices.voiceId) {
				newState.guild.channels
					.create(room.title, {
						type: 'GUILD_VOICE',
						parent: categoryId,
						permissionOverwrites: [
							{
								id: newState.member.id,
								allow: ['MANAGE_CHANNELS', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS'],
							},
							{
								id: newState.guild.id,
								deny: ['MANAGE_CHANNELS'],
							},
						],
					})
					.then(async (channel) => {
						await Personal.findByIdAndUpdate(room.id, {
							$set: {
								'personal_voices.voiceId': channel.id,
							},
						})
						newState.setChannel(channel)
					})
			} else {
				if (!room.tmpTime) {
					console.log('aboba')
					room.tmpTime = Date.now()
					await room.save()
				}
				newState.setChannel(room.personal_voices.voiceId)
			}
		}
	}
}

function getVoiceTimeStr(time) {
	let days = Math.floor((time / (1000 * 60 * 60 * 24)) % 30)
	let hours = Math.floor((time / (1000 * 60 * 60)) % 24)
	let minutes = Math.floor((time / (1000 * 60)) % 60)
	let seconds = Math.floor((time / 1000) % 60)

	if (minutes == 0) return `${seconds} секунд`
	if (hours == 0) return `${minutes} минут, ${seconds} секунд`
	if (days == 0) return `${hours} часов,  ${minutes} минут, ${seconds} секунд`
	else return `${days} дней, ${hours} часов, ${minutes} минут`
}

function getRoleTimeStr(time) {
	const date = new Date(time)
	return `${date.getHours()}:${String(date.getMinutes()).padStart(
		2,
		'0',
	)}, ${date.getDate()}.${String(date.getMonth()).padStart(
		2,
		'0',
	)}.${date.getFullYear()}`
}
function getDateTimeStr(time) {
	const date = new Date(time)
	return `${date.getDate()}.${String(date.getMonth()).padStart(
		2,
		'0',
	)}.${date.getFullYear()}`
}

async function setModalSubmit(interaction) {
	switch (interaction.customId) {
		case 'donate': {
			const modal = new Modal().setCustomId('myModal').setTitle('Донат-Магазин')
			const Input = new TextInputComponent()
				.setCustomId('Input')
				.setPlaceholder('Купить рубли')
				.setLabel('Введите количество рублей')
				.setStyle('SHORT')
				.setMinLength(1)
			const firstActionRow = new MessageActionRow().addComponents(Input)
			modal.addComponents(firstActionRow)
			await interaction.showModal(modal)
			break
		}

		case 'settingPersonal': {
			const modal = new Modal()
				.setCustomId('settingPersonalModal')
				.setTitle('Настройки персональной комнаты')
			const Title = new TextInputComponent()
				.setCustomId('Title')
				.setPlaceholder('Название комнаты')
				.setLabel('Введите новое название')
				.setStyle('PARAGRAPH')
				.setMinLength(1)
				.setMaxLength(25)
			const Description = new TextInputComponent()
				.setCustomId('Description')
				.setPlaceholder('Описание')
				.setLabel('Ведите новое описание')
				.setStyle('SHORT')
				.setMinLength(1)
				.setMaxLength(200)
			const ImageUrl = new TextInputComponent()
				.setCustomId('ImageUrl')
				.setPlaceholder('Баннер')
				.setLabel('Ведите url изображеия')
				.setStyle('SHORT')
				.setMaxLength(500)
			const firstActionRow = new MessageActionRow().addComponents(Title)
			const secondActionRow = new MessageActionRow().addComponents(Description)
			const thirddActionRow = new MessageActionRow().addComponents(ImageUrl)
			modal.addComponents(firstActionRow, secondActionRow, thirddActionRow)
			await interaction.showModal(modal)
			break
		}
		case 'settingLove': {
			const modal = new Modal()
				.setCustomId('settingLoveModal')
				.setTitle('Настройки любовного профиля')
			const Title = new TextInputComponent()
				.setCustomId('Title')
				.setPlaceholder('Название комнаты')
				.setLabel('Введите новое название')
				.setStyle('PARAGRAPH')
				.setMinLength(1)
				.setMaxLength(25)
			const Description = new TextInputComponent()
				.setCustomId('Description')
				.setPlaceholder('Описание')
				.setLabel('Ведите новое описание')
				.setStyle('SHORT')
				.setMinLength(1)
				.setMaxLength(200)
			const ImageUrl = new TextInputComponent()
				.setCustomId('ImageUrl')
				.setPlaceholder('Баннер')
				.setLabel('Ведите url изображеия')
				.setStyle('SHORT')
				.setMaxLength(500)
			const firstActionRow = new MessageActionRow().addComponents(Title)
			const secondActionRow = new MessageActionRow().addComponents(Description)
			const thirddActionRow = new MessageActionRow().addComponents(ImageUrl)
			modal.addComponents(firstActionRow, secondActionRow, thirddActionRow)
			await interaction.showModal(modal)
			break
		}
		case 'topUpLove': {
			const modal = new Modal()
				.setCustomId('topUpLoveModal')
				.setTitle('Пополнить баланс')

			const Amount = new TextInputComponent()
				.setCustomId('Amount')
				.setPlaceholder('Койнов')
				.setLabel('Введите количество койнов')
				.setStyle('SHORT')
				.setMinLength(1)

			const firstActionRow = new MessageActionRow().addComponents(Amount)
			modal.addComponents(firstActionRow)
			await interaction.showModal(modal)
			break
		}
		case 'topUpPersonal': {
			const modal = new Modal()
				.setCustomId('topUpPersonalModal')
				.setTitle('Пополнить баланс')

			const Amount = new TextInputComponent()
				.setCustomId('Amount')
				.setPlaceholder('Койнов')
				.setLabel('Введите количество койнов')
				.setStyle('SHORT')
				.setMinLength(1)

			const firstActionRow = new MessageActionRow().addComponents(Amount)
			modal.addComponents(firstActionRow)
			await interaction.showModal(modal)
			break
		}
		case 'kickUser': {
			const modal = new Modal()
				.setCustomId('kick')
				.setTitle('Изменение лимита пользователей')
			const Input = new TextInputComponent()
				.setCustomId('InputKick')
				.setPlaceholder('ID-пользователя')
				.setLabel('Введите ID-пользователя')
				.setStyle('SHORT')
				.setMinLength(1)
				.setMaxLength(20)
			const firstActionRow = new MessageActionRow().addComponents(Input)
			modal.addComponents(firstActionRow)
			await interaction.showModal(modal)
			break
		}
	}

	if (interaction.isModalSubmit()) {
		switch (interaction.customId) {
			case 'kick': {
				let user = await User.findOne({ userId: interaction.user.id })
				const personalRoom = await Personal.findById(user.personalRoomId)
				let input = interaction.fields.getTextInputValue('InputKick')
				let inputuser = await User.findOne({ userId: input })
				if (inputuser?.personalRoomId == personalRoom.id) {
					inputuser.personalRoomId = ''
					personalRoom.count -= 1
					const content = `${interaction.user.id} Вы выгнали пользователя`
					await personalRoom.save()
					await inputuser.save()
					return await interaction.reply({ content, ephemeral: true })
				} else {
					const content = `${interaction.user.id} неправильно указан id пользователя`

					return await interaction.reply({ content, ephemeral: true })
				}
			}
			case 'myModal': {
				const amount = interaction.fields.getTextInputValue('Input')
				const channel = client.channels.cache.get('1026476189788934174')
				const content = `<@${interaction.user.id}>, **Ваша** заявка **на** пополнение **${amount}** рублей **создана.**`
				const Embed = new MessageEmbed()
					.setTitle(`Донат магазин — ${interaction.user.username}`)
					.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
					.setDescription(
						`<@${interaction.user.id}>, **Чтобы** пополнить **баланс** вам **необходимо** перевести сумму на киви кошелек 8(434)304 93-30 с коминтарием \`${interaction.user.id}\``,
					)

				interaction.member.send({ embeds: [Embed] })
				channel.send({ content })
				return await interaction.reply({ content, ephemeral: true })
			}
			case 'settingLoveModal': {
				let user = await User.findOne({ userId: interaction.user.id })
				const loveRoom = await Love.findById(user.loveRoomId)
				const title = interaction.fields.getTextInputValue('Title')
				const description = interaction.fields.getTextInputValue('Description')
				const imageUrl = interaction.fields.getTextInputValue('ImageUrl')

				if (title) loveRoom.title = title
				if (description) loveRoom.description = description
				if (imageUrl && imageUrl.endsWith('.jpg')) loveRoom.imageUrl = imageUrl

				await loveRoom.save()
				return await interaction.reply({
					content: `<@${interaction.user.id}>, **Настройки обновлены!**`,
					ephemeral: true,
				})
			}
			case 'settingPersonalModal': {
				let user = await User.findOne({ userId: interaction.user.id })
				const personalRoom = await Personal.findById(user.personalRoomId)
				const title = interaction.fields.getTextInputValue('Title')
				const description = interaction.fields.getTextInputValue('Description')
				const imageUrl = interaction.fields.getTextInputValue('ImageUrl')

				if (title) personalRoom.title = title
				if (description) personalRoom.description = description
				if (imageUrl && imageUrl.endsWith('.jpg'))
					personalRoom.imageUrl = imageUrl

				await personalRoom.save()
				return await interaction.reply({
					content: `<@${interaction.user.id}>, **Настройки обновлены!**`,
					ephemeral: true,
				})
			}
			case 'topUpLoveModal': {
				const amount = interaction.fields.getTextInputValue('Amount')
				const user = await User.findOne({ userId: interaction.user.id })
				const loveRoom = await Love.findById(user.loveRoomId)
				const roleInfo = await Product.findOne({
					roleId: '1022547796781436948',
				})
				const condition = roleInfo.terms.get(interaction.user.id) < Date.now()

				if (user.coins >= amount) {
					user.coins -= amount
					loveRoom.coins += amount
					await user.save()
					await loveRoom.save()
				} else {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Недостаточно** койнов **для** пополнения **баланса!**`,
						)
					return await interaction.reply({
						embeds: [Embed],
						components: [],
					})
				}

				if (loveRoom.coins >= 750 && condition) {
					loveRoom.coins -= 750

					const users = await User.find({ loveRoomId: love.id })
					users.forEach(async (e) => {
						roleInfo.terms.delete(e.userId)
						roleInfo.terms.set(e.userId, Date.now() + 30 * 60 * 1000 * 60 * 24)
						await roleInfo.save()
					})

					await user.save()
					await loveRoom.save()
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** продлили **любовную** **комнату** на **30** дней!`,
						)
					return await interaction.reply({
						embeds: [Embed],
						components: [],
					})
				} else {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** пополнили кошелек на **${amount}** койнов!`,
						)
					return await interaction.reply({
						embeds: [Embed],
						components: [],
					})
				}
			}
			case 'topUpPersonalModal': {
				const amount = interaction.fields.getTextInputValue('Amount')
				const user = await User.findOne({ userId: interaction.user.id })
				const personalRoom = await Personal.findById(user.personalRoomId)
				const roleInfo = await Product.findOne({
					roleId: '1027594002205257798',
				})
				const condition = roleInfo.terms.get(interaction.user.id) < Date.now()

				if (user.coins >= amount) {
					user.coins -= amount
					personalRoom.coins += amount
					await user.save()
					await personalRoom.save()
				} else {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Недостаточно** койнов **для** пополнения **баланса!**`,
						)
					return await interaction.reply({
						embeds: [Embed],
						components: [],
					})
				}

				if (personalRoom.coins >= 750 && condition) {
					personalRoom.coins -= 750

					const users = await User.find({ personalRoomId: love.id })
					users.forEach(async (e) => {
						roleInfo.terms.delete(e.userId)
						roleInfo.terms.set(e.userId, Date.now() + 30 * 60 * 1000 * 60 * 24)
						await roleInfo.save()
					})

					await user.save()
					await personalRoom.save()
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** продлили **любовную** **комнату** на **30** дней!`,
						)
					return await interaction.reply({
						embeds: [Embed],
						components: [],
					})
				} else {
					const Embed = new MessageEmbed()
						.setTitle(`Любовный профиль — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** пополнили кошелек на **${amount}** койнов!`,
						)
					return await interaction.reply({
						embeds: [Embed],
						components: [],
					})
				}
			}
		}
	}
}
module.exports = {
	setVoiceTime,
	getPersonalRoom,
	getLoveRoom,
	setUserLvl,
	getRandomRoom,
	getVoiceTimeStr,
	getRoleTimeStr,
	getDateTimeStr,
	setModalSubmit,
}
