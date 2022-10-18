const { Schema, model } = require('mongoose')

const productSchema = new Schema({
	ownerId: { type: String, required: true },
	terms: { type: Map, default: new Map() },
	price: Number,
	roleId: String,

	description: String,

	multiplier: { type: Number, default: 1 },
	commission: { type: Number, default: 5 },
	count: { type: Number, default: 0 },

	tradable: { type: Boolean, default: false },
	privilege: { type: Number, default: 0 },
})

module.exports = model('Product', productSchema)
