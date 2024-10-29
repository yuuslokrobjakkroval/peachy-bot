const { model, Schema } = require('mongoose');

const GiveawayShopItemSchema = new Schema({
    guildId: { type: String, default: null },
    channelId: { type: String, default: null },
    messageId: { type: String, required: true, unique: true },
    winners: { type: Number, default: 1 },
    itemId: { type: String, required: true },  // Storing item name or ID
    type: { type: String, enum: ['food', 'drink', 'theme', 'milk'], required: true }, // To specify item type
    amount: { type: Number, required: true, default: 1 }, // Amount of items to give away
    image: { type: String, default: null }, // URL for giveaway image
    thumbnail: { type: String, default: null }, // URL for giveaway thumbnail
    endTime: { type: Number, default: null },
    paused: { type: Boolean, default: false },
    ended: { type: Boolean, default: false },
    hostedBy: { type: String, default: null },
    entered: { type: [String], default: [] },
    autoAdd: { type: Boolean, default: false }, // Corrected from autopay to autoAdd for clarity
    retryAutopay: { type: Boolean, default: false },
    winnerId: { type: [String], default: [] },
    rerollOptions: { type: [String], default: [] },
    rerollCount: { type: Number, default: 0 },
    rerolledWinners: { type: [String], default: [] },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('giveawayShopItem', GiveawayShopItemSchema);
