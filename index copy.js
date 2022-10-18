const fs = require('fs')
const { Client, Collection, Intents } = require('discord.js')
const { Modal, TextInputComponent, MessageActionRow } = require('discord.js')
const { token, db } = require('./config.json')
const mongoose = require('mongoose')
const { setTimeCounter, setUserLvl } = require('./components')
const { getRandomRoom, getLoveRoom, getPersonalRoom } = require('./components')
const Product = require('./models/Product')
const { create } = require('./models/Personal')
const Personal = require('./models/Personal')
const User = require('./models/User')
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
const crate = async () => {
	// await Product.create({
	// 	roleId: '1008734685419024405',
	// 	ownerId: '1008002556179529799',
	// 	price: 500,
	// 	description:
	// 		'`- Временная награда x3`\n`- Возможность отправлять картинки в чат`\n`- Снижена комиссия на переводы до 3%`',
	// 	privilege: 1,
	// })
	// await Product.create({
	// 	roleId: '974602858521587712',
	// 	ownerId: '1008002556179529799',
	// 	price: 1000,
	// 	description:
	// 		'`- Временная награда x4`\n`- Возможность оставлять реакции`\n`- Снижена комиссия на переводы до 2%`\n`- А также привилегии преведущего разряда`',
	// 	privilege: 2,
	// })
	// await Product.create({
	// 	roleId: '974603537755566092',
	// 	ownerId: '1008002556179529799',
	// 	price: 1500,
	// 	description:
	// 		'`- Временная награда x5`\n`- Доступ в текстовые и голосовые каналы категории администрации`\n`- Снижена комиссия на переводы до 1%`\n`- А также привилегии преведущего разряда`',
	// 	privilege: 3,
	// })
	// await Product.create({
	// 	roleId: '974604025301450772',
	// 	ownerId: '1008002556179529799',
	// 	price: 2500,
	// 	description:
	// 		'`- Временная награда x6`\n`- Возможность заходить в переполненные каналы`\n`- Убирает всю комиссию в магазине`\n`- А также привилегии преведущего разряда`',
	// 	privilege: 4,
	// })
	await Product.create({
		roleId: '1022547796781436948',
		ownerId: '1025752014233288767',
	})
	const a = await Product.find()
	console.log(a)
	// a.forEach(async (d) => await d.delete())
}
// crate()
const findAboba = async () => {
	const user = await Product.findOne({ roleId: '1022547796781436948' })
	console.log(user)
	// delete user.price
	// user.save()
}
// findAboba()
const abobas = async () => {
	const t = await Product.create({
		ownerId: '1025752014233288767',
		roleId: '1022547796781436948',
	})
	console.log(t)
	await t.delete()
}
// abobas()
const createss = async () => {
	// const room = await Personal.create({
	// 	ownerId: '1007597856212922398',
	// 	imageUrl:
	// 		'https://i.pinimg.com/564x/27/6f/86/276f86fdac25706498407e8962930f33.jpg',
	// 	title: 'spermys',
	// 	description: 'syper spermys joing us',
	// 	coins: 32,
	// })
	const abobsa = 'terms.1007597856212922398'
	const user = await Product.find({
		[`terms.${String(1007597856212922398)}`]: { $gte: Date.now() },
	})
	// const user = await Product.findOne({ ownerId: '1007597856212922398' })
	// user.personalRoomId = room.id
	// user.imageUrl =
	// 	'https://media.discordapp.net/attachments/958421267814436874/999117503949189120/IMG_20220720_035546_622.jpg'
	// await user.save()
	console.log(user)
}
// createss()
const aboba = async () => {
	const user = await User.findOne({ userId: '1007597856212922398' })
	const loveRoom = await Love.create({ ownerId: '1007597856212922398' })
	const roleInfo = await Product.findOne({ roleId: '1022547796781436948' })
	if (roleInfo.terms.has('1007597856212922398')) {
		roleInfo.terms.delete('1007597856212922398')
	}
	roleInfo.terms.set(
		'1007597856212922398',
		Date.now() + 30 * 60 * 1000 * 60 * 24,
	)
	user.loveRoomId = loveRoom.id
	user.spouseId = '840518551369416724'
	await user.save()
	await roleInfo.save()
	await loveRoom.save()
}
aboba()
// console.log(interaction.customId)
// if (interaction.customId == 'donate') {
// 	const modal = new Modal().setCustomId('myModal').setTitle('Донат- Магазин')
// 	const Input = new TextInputComponent()
// 		.setCustomId('Input')
// 		.setPlaceholder('Купить рубли')
// 		.setLabel('Введите количество рублей')
// 		.setStyle('SHORT')
// 		.setMinLength(1)
// 		.setMaxLength(24)
// 	firstActionRow = new MessageActionRow().addComponents(Input)
// 	modal.addComponents(firstActionRow)
// 	await interaction.showModal(modal)
// }
// if (interaction.isModalSubmit()) {
// 	if (interaction.customId === 'myModal') {
// 		const input = interaction.fields.getTextInputValue('Input')
// 		const channel = client.channels.cache.get('1026476189788934174')
// 		const content = <@${interaction.user.id}>\n + input
// 		channel.send({ content })
// 		return await interaction.reply('ok')
// 	}
// }
