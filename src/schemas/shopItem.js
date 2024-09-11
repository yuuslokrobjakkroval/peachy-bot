const { model, Schema } = require('mongoose');

const ShopItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, default: null },
    type: { type: String, enum: ['food', 'drink', 'cute'], required: true },
    price: {
        buy: { type: Number, required: true },
        sell: { type: Number, required: true }
    },
    quantity: { type: Number, default: 1 },
    emoji: { type: String, required: true },  // Store emoji as string
    expGain: { type: Number, default: 0 },
    description: { type: String, default: '' },
    available: { type: Boolean, default: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = model('ShopItem', ShopItemSchema);
