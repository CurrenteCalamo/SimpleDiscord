const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const User = require('../models/User')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('duel')
		.setDescription('Вызвать на дуэль')
		.addIntegerOption((option) =>
			option
				.setRequired(true)
				.setMinValue(50)
				.setName('amount')
				.setDescription('Ваша ставка')
				.setRequired(true),
		),
	execute: async (interaction) => {
		const amount = interaction.options.getInteger('amount')

		let user = await User.findOne({ userId: interaction.user.id })
		if (!user) {
			user = await User.create({ userId: interaction.user.id })
		}

		if (user.coins < amount) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **У** вас недостаточно **${
					amount - user.coins
				}** койнов.`,
				ephemeral: true,
			})
		}

		const Embed = new MessageEmbed()
			.setTitle(`Дуэль — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${interaction.user.id}>, **Хочет** сразиться на **${amount}** койнов!`,
			)

		const Buttons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Cразиться')
				.setStyle('SUCCESS')
				.setCustomId('fight')
				.setEmoji('🃏'),
		)
		const initialInteraction = await interaction.reply({
			embeds: [Embed],
			components: [Buttons],
			fetchReply: true,
		})
		let enemy
		const filter = async (i) => {
			i.deferUpdate()
			enemy = await User.findOne({ userId: i.user.id })
			if (!enemy) {
				enemy = await User.create({ userId: i.user.id })
			}

			return i.user.id != interaction.user.id && enemy.coins > amount
		}
		const collector = initialInteraction.createMessageComponentCollector({
			filter,
			time: 10000,
		})

		collector.on('collect', async (i) => {
			switch (i.customId) {
				case 'fight': {
					if (Math.floor(Math.random() * 10) >= 5) {
						const commision =
							(100 - (enemy.commission == 0 ? 100 : enemy.commission)) / 100
						const reward = Math.floor(amount * commision)
						const Embed = new MessageEmbed()
							.setTitle(`Дуэль — ${interaction.user.username}`)
							.setThumbnail(i.user.displayAvatarURL({ dynamic: false }))
							.setDescription(
								`<@${i.user.id}>, **Вы** одержали **победу** над <@${
									interaction.user.id
								}>, и получили **${reward}** койнов!${
									enemy.commission == 0
										? ''
										: ` **Включая** коммисию **${enemy.commission}%**`
								}`,
							)

						user.coins -= amount
						await user.save()
						enemy.coins += reward
						await enemy.save()

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					} else {
						const commision =
							(100 - (user.commission == 0 ? 100 : user.commission)) / 100

						const reward = Math.floor(amount * commision)
						const Embed = new MessageEmbed()
							.setTitle(`Дуэль — ${interaction.user.username}`)
							.setThumbnail(
								interaction.user.displayAvatarURL({ dynamic: false }),
							)
							.setDescription(
								`<@${interaction.user.id}>, **Вы** одержали **победу** над <@${
									i.user.id
								}>, и получили **${reward}** койнов!${
									user.commission == 0
										? ''
										: ` **Включая** коммисию **${user.commission}%**`
								}`,
							)

						user.coins += reward
						await user.save()
						enemy.coins -= amount
						await enemy.save()

						return await interaction.editReply({
							embeds: [Embed],
							components: [],
						})
					}
				}
			}
		})
		setTimeout(() => collector.stop('timeout'), 20000)

		collector.on('end', (i) => {
			if (initialInteraction && i.size == 0) {
				const Embed = new MessageEmbed()
					.setTitle(`Дуэль — ${interaction.user.username}`)
					.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
					.setDescription(
						`<@${interaction.user.id}>, **Никто** не **захотел** сразиться с **вами!**`,
					)

				initialInteraction.edit({
					embeds: [Embed],
					components: [],
				})
			}
		})
	},
}
