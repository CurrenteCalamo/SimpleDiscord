const { Schema, model } = require('mongoose')

const userSchema = new Schema({
	userId: { type: String, required: true },

	lvl: { type: Number, default: 0 },
	xp: { type: Number, default: 0 },
	privilege: { type: Number, default: 0 },

	tmpTime: { type: Number, default: 0 },
	rewardTime: { type: Number, default: 0 },
	lastTime: { type: Number, default: 0 },
	allTime: { type: Number, default: 0 },
	dayTime: { type: Number, default: 0 },

	coins: { type: Number, default: 0 },
	rubles: { type: Number, default: 0 },

	multiplier: { type: Number, default: 1 },
	commission: { type: Number, default: 5 },

	spouseId: String,
	loveRoomId: String,
	personalRoomId: String,
})

module.exports = model('User', userSchema)
