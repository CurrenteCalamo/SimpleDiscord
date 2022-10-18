const fs = require('fs')
const {
	Client,
	Collection,
	Intents,
	MessageEmbed,
	MessageAttachment,
	InteractionCollector,
} = require('discord.js')
const { Modal, TextInputComponent, MessageActionRow } = require('discord.js')
const { token, db } = require('./config.json')
const mongoose = require('mongoose')
const { setVoiceTime, setUserLvl, setModalSubmit } = require('./components')
const { getRandomRoom, getLoveRoom, getPersonalRoom } = require('./components')
const Personal = require('./models/Personal')
const User = require('./models/User')
const Guild = require('./models/Guild')
const DIG = require('discord-image-generation')
const Product = require('./models/Product')
const Love = require('./models/Love')

const connectDB = async () => {
	try {
		mongoose.connect(db, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		console.log('MongoDB connected')
	} catch (error) {
		console.log(error.message)
		process.exit(1)
	}
}
connectDB()

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MESSAGE_TYPING,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_TYPING,
	],
})

client.commands = new Collection()
const commandFiles = fs
	.readdirSync('./commands')
	.filter((file) => file.endsWith('.js'))
for (const file of commandFiles) {
	const command = require(`./commands/${file}`)
	client.commands.set(command.data.name, command)
}

async function setGuild() {
	await Guild.create({ guildId: '969992579468914751' })
	await Guild.updateOne(
		{ guildId: '969992579468914751' },
		{
			$set: {
				'personal_voices.mode': true,
				'personal_voices.categoryId': '972490997969862777',
				'personal_voices.channelId': '969992585575804953',
				'personal_voices.textId': '1018584919603171348',

				'love_voices.mode': true,
				'love_voices.categoryId': '1022908721833197679',
				'love_voices.channelId': '1018090051986534421',
				'love_voices.textId': '1018584919603171348',
			},
		},
	)
	console.log(await Guild.find())
}
// setGuild()

client.on('interactionCreate', async (interaction) => {
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
	///
	if (!interaction.isCommand()) return
	const command = client.commands.get(interaction.commandName)

	if (!command) return

	try {
		await command.execute(interaction, client)
	} catch (error) {
		console.error(error)
		await interaction.reply({
			content: 'There was an error while executing this command!',
			ephemeral: true,
		})
	}
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
	setVoiceTime(oldMember, newMember)
	getRandomRoom(oldMember, newMember)

	getLoveRoom(oldMember, newMember)
	getPersonalRoom(oldMember, newMember)
})

client.on('message', async (message) => {
	if (
		message.channel.type == 'GUILD_TEXT' &&
		message.author.id != '1025752014233288767' &&
		message.author.id != '1008002556179529799'
	) {
		setUserLvl(message)
	}

	if (message.content == 'triggered') {
		message.delete()
		const uid = message.author.id
		let user = await User.findOne({ userId: uid })
		if (!user) {
			user = await User.create({ userId: uid })
		}

		if (user.privilege > 0) {
			let avatar = message.author.displayAvatarURL({
				dynamic: false,
				format: 'png',
			})

			let img = await new DIG.Triggered().getImage(avatar)
			img = new MessageAttachment(img, 'blur.gif')

			message.channel.send({ files: [img] })
		}
	}
})

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`)
	client.user.setStatus('dnd')
})
client.login(token)
