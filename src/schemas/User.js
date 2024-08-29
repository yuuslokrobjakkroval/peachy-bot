const { model, Schema } = require("mongoose");
const Config = require('../config.js');

const InventoryItemSchema = new Schema({
    item: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const EquipItemSchema = new Schema({
    item: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const CooldownSchema = new Schema({
    name: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    duration: { type: Number, required: true }
});

const userSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    gender: { type: String, default: null },
    prefix: { type: String, default: Config.prefix },
    language: { type: String, default: Config.language.defaultLocale },
    verification: {
        status: { type: Boolean, default: false },
        code: { type: String, default: null }
    },
    balance: {
        coin: { type: Number, default: 0 },
        bank: { type: Number, default: 0 }
    },
    dailyLimits: {
        lastReset: { type: Date, default: new Date() },
        transferUsed: { type: Number, default: 0 },
        receiveUsed: { type: Number, default: 0 },
        transferLimit: { type: Number, default: 64000 },
        receiveLimit: { type: Number, default: 64000 }
    },
    peachy: {
        streak: { type: Number, default: 0 }
    },
    profile: {
        bio: { type: String, default: null, maxlength: 200 },
        birthday: { type: String, default: null },
        facebook: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
        instagram: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
        exp: { type: Number, default: 0 },
        levelExp: { type: Number, default: 1000 },
        level: { type: Number, default: 1 },
        lastXpGain: { type: Number, default: 0 },
        visibility: { status: { type: Boolean, default: false }, message: { type: String, default: null }} ,
        likes: { type: [String], default: [] }
    },
    marriage: {
        status: { type: String, default: 'single' },
        marriedTo: { type: String, default: null },
        item: { type: String, default: null },
        dateOfRelationship: { type: Date, default: null }
    },
    bestie: [{
        bestieWith: String,
        dateOfBestie: Date
    }],
    inventory: { type: [InventoryItemSchema], default: [] },
    equip: { type: [EquipItemSchema], default: [] },
    cooldowns: { type: [CooldownSchema], default: [] },
    levelBackground: {
        guildId: { type: String },
        channelId: { type: String },
        useEmbed: { type: Boolean, default: false },
        messages: [
            {
                content: { type: String, required: true },
            },
        ],
    }
});

module.exports = model('user', userSchema);