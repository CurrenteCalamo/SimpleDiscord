const mongoose = require('mongoose')

const guildSchema = mongoose.Schema({
	guildId: String,
	love_voices: {
		mode: { type: Boolean, default: false },
		categoryId: String,
		channelId: String,
		textId: String,
	},
	personal_voices: {
		mode: { type: Boolean, default: false },
		categoryId: String,
		channelId: String,
		textId: String,
	},
})

module.exports = mongoose.model('GuildConfigser', guildSchema)
