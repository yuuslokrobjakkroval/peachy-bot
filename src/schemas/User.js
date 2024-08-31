const { model, Schema } = require("mongoose");
const config = require('../config.js');

// Define the schemas for inventory, equipment, and cooldowns
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
    prefix: { type: String, default: config.prefix },
    username: { type: String, default: null },
    gender: { type: String, default: null },
    language: { type: String, default: config.language.defaultLocale },
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
        birthdayAcknowledged: { type: Boolean, default: false }, // New field
        facebook: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
        instagram: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
        tiktok: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
        exp: { type: Number, default: 0 },
        levelExp: { type: Number, default: 1000 },
        level: { type: Number, default: 1 },
        lastXpGain: { type: Number, default: 0 },
        visibility: { status: { type: Boolean, default: false }, message: { type: String, default: null }},
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
    },
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' },
    },
    achievements: [{
        name: { type: String, required: true },
        dateEarned: { type: Date, default: Date.now }
    }],
    activity: {
        lastLogin: { type: Date, default: Date.now },
        totalMessagesSent: { type: Number, default: 0 },
    },
    dailyTasks: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['peach', 'transfer'], required: true },
        progress: { type: Number, default: 0 },
        requiredAmount: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
    }],
});

module.exports = model('user', userSchema);
