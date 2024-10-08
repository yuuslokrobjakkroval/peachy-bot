const { model, Schema } = require('mongoose');

const ShopItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, default: null },
    type: { type: String, enum: ['food', 'drink', 'theme', 'exchange'], required: true },
    price: {
        buy: { type: Number, required: true },
        sell: { type: Number, required: true }
    },
    quantity: { type: Number, default: 1 },
    emoji: { type: String, required: true },
    xp: { type: Number, default: 0 },
    description: { type: String, default: '' },
    available: { type: [String], default: ['use'] },
    limit: { type: Number, default: null },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('ShopItem', ShopItemSchema);
