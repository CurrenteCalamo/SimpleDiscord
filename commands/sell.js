const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const Product = require('../models/Product')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sell')
		.setDescription(`Выставить на продажу личную роль`)
		.addRoleOption((option) =>
			option.setName('role').setDescription('Выберите роль').setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setMinValue(50)
				.setName('amount')
				.setDescription('Цена при продаже')
				.setRequired(true),
		),
	async execute(interaction) {
		const role = interaction.options.getRole('role')
		const amount = interaction.options.getInteger('amount')
		const roleInfo = await Product.findOne({ roleId: role.id })

		if (roleInfo.ownerId != interaction.user.id) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Вы** не **евляетесь** владельцом **роли** <@&${role.id}>!`,
				ephemeral: true,
			})
		}
		if (roleInfo.tradable) {
			return await interaction.reply({
				content: `<@${interaction.user.id}>, **Роль** <@&${role.id}> уже **продается!**`,
				ephemeral: true,
			})
		}

		const Embed = new MessageEmbed()
			.setTitle(`Продажа роли — ${interaction.user.username}`)
			.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
			.setDescription(
				`<@${interaction.user.id}>, **Вы** уверены, что **хотите** выставить на **продажу** <@&${role.id}> за **${amount}** койнов?`,
			)

		const Buttons = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel('Отмена')
				.setStyle('DANGER')
				.setCustomId('cancel'),
			new MessageButton()
				.setLabel('Выставить на продажу')
				.setStyle('SUCCESS')
				.setCustomId('putUp'),
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
			time: 10000,
		})
		collector.on('collect', async (i) => {
			switch (i.customId) {
				case 'putUp': {
					roleInfo.price = amount
					roleInfo.tradable = true
					await roleInfo.save()

					await i.member.roles.remove(role.id)
					const Embed = new MessageEmbed()
						.setTitle(`Продажа роли — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Роль** <@&${role.id}> выставлена на **продажу!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
				case 'cancel': {
					const Embed = new MessageEmbed()
						.setTitle(`Продажа роли — ${interaction.user.username}`)
						.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
						.setDescription(
							`<@${interaction.user.id}>, **Вы** oтменили **действие** с **ролью!**`,
						)
					return await interaction.editReply({
						embeds: [Embed],
						components: [],
					})
				}
			}
		})

		setTimeout(() => collector.stop('timeout'), 10000)
		collector.on('end', async (i) => {
			if (initialInteraction && i.size == 0) {
				const Embed = new MessageEmbed()
					.setTitle(`Продажа роли — ${interaction.user.username}`)
					.setThumbnail(interaction.user.displayAvatarURL({ dynamic: false }))
					.setDescription(
						`<@${interaction.user.id}>, **Вы** oтменили **действие** с **ролью!**`,
					)
				initialInteraction.edit({
					embeds: [Embed],
					components: [],
				})
			}
		})
	},
}
