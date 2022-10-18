const { SlashCommandBuilder } = require('@discordjs/builders')
const { DiscordTogether } = require('discord-together')
const { MessageActionRow, MessageSelectMenu } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('activity')
		.setDescription('Начать активность в голосовом канале')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('Выберите канал')
				.setRequired(true),
		),
	async execute(interaction, client) {
		const channel = interaction.options.getChannel('channel')
		client.discordTogether = new DiscordTogether(client)

		if (!interaction.member.guild.me.permissions.has('CREATE_INSTANT_INVITE')) {
			return interaction.reply({
				content: `<@${interaction.user.id}>, **Отсутствует** разрешение. **Убедитесь**, что у вас есть **разрешения** «Создовать приглашения»!`,
				ephemeral: true,
			})
		}

		if (!channel.isVoice()) {
			return interaction
				.reply({
					content: `<@${interaction.user.id}>, **Выбранный** канал, должен быть **голосовым!**`,
					ephemeral: true,
				})
				.catch(console.error)
		}

		const Row = (state) =>
			new MessageActionRow().addComponents(
				new MessageSelectMenu()
					.setCustomId('activity')
					.setPlaceholder('📬 Ничего не выбрано!')
					.setDisabled(state)
					.addOptions([
						{
							label: 'YouTube Together',
							description:
								'Создает приглашение на активность на YouTube Together',
							value: 'youtube',
							emoji: '<:youtube:892459181838323752>',
						},
						{
							label: 'Poker',
							description: 'Создает приглашение на мероприятие Poker Night',
							value: 'poker',
							emoji: '🃏',
						},
						{
							label: 'Fishing',
							description: 'Создает приглашение на мероприятие Fishington.io',
							value: 'fishing',
							emoji: '🐟',
						},
						{
							label: 'Betrayal',
							description: 'Создает приглашение на активность Betrayal.io',
							value: 'betrayal',
							emoji: '🗳️',
						},
						{
							label: 'Chess',
							description: 'Создает приглашение на занятие шахматами',
							value: 'chess',
							emoji: '♟️',
						},
						{
							label: 'Letter Tile',
							description: 'Создает приглашение на активность Letter Tile',
							value: 'lettertile',
							emoji: '🅿️',
						},
						{
							label: 'Word Snack',
							description: 'Создает приглашение к действию Word Snack',
							value: 'wordsnack',
							emoji: '🍜',
						},
						{
							label: 'Doodle Crew',
							description: 'Создает приглашение на занятие Doodle Crew',
							value: 'doodlecrew',
							emoji: '🎨',
						},
					]),
			)
		const initialInteraction = await interaction.reply({
			content: 'Выберите действие из списка ниже:',
			components: [Row(false)],
			fetchReply: true,
		})

		const collector = initialInteraction.createMessageComponentCollector({
			componentType: 'SELECT_MENU',
		})

		collector.on('collect', async (i) => {
			if (i.user.id != interaction.user.id) return

			const value = i.values[0]
			switch (value) {
				case 'youtube':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к YouTube Together](${invite.code} "Присоединяйтесь к YouTube Together")`,
							})
						})
					break
				case 'poker':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Poker Night](${invite.code} "Присоединяйтесь к Poker Night")`,
							})
						})
					break
				case 'fishing':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Fishington.io](${invite.code} "Присоединяйтесь к fishington.io")`,
							})
						})
					break
				case 'betrayal':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Betrayal.io](${invite.code} "Присоединяйтесь к betrayal.io")`,
							})
						})
					break
				case 'chess':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Chess](${invite.code} "Присоединяйтесь к A game of Chess")`,
							})
						})
					break
				case 'lettertile':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Letter tile](${invite.code} "Присоединяйтесь к A game of Letter tile")`,
							})
						})
					break
				case 'wordsnack':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Word snack](${invite.code} "Присоединяйтесь к A game of Word snack")`,
							})
						})
					break
				case 'doodlecrew':
					client.discordTogether
						.createTogetherCode(channel.id, value)
						.then(async (invite) => {
							await i.deferUpdate()
							return await i.editReply({
								content: `[Нажмите здесь, чтобы присоединиться к Doodle Crew](${invite.code} "Присоединяйтесь к A game of Doodle Crew")`,
							})
						})
					break
			}
		})
		setTimeout(() => collector.stop('timeout'), 20000)

		collector.on('end', () => {
			if (initialInteraction) {
				initialInteraction.edit({ components: [Row(true)] })
			}
		})
	},
}
