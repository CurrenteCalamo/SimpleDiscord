const mongoose = require('mongoose')

const personalSchema = mongoose.Schema({
	ownerId: { type: String, required: true },
	personal_voices: {
		voiceId: { type: String, default: null },
		lock: { type: Boolean, default: true },
	},
	title: String,
	imageUrl: String,
	description: String,

	allTime: {
		type: Number,
		default: 0,
	},
	tmpTime: {
		type: Number,
		default: 0,
	},
	coins: {
		type: Number,
		default: 0,
	},
	count: {
		type: Number,
		default: 1,
	},
	date: { type: Number, default: Date.now() },
})

module.exports = mongoose.model('Personal', personalSchema)
