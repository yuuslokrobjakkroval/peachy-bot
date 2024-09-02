const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const equalSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 }
});

const dailyLimitSchema = new mongoose.Schema({
    lastReset: { type: Date, default: Date.now },
    receiveUsed: { type: Number, default: 0 },
    receiveLimit: { type: Number, default: 0 },
    transferUsed: { type: Number, default: 0 },
    transferLimit: { type: Number, default: 0 }
});

const cooldownSchema = new mongoose.Schema({
    name: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    duration: { type: Number, required: true }
});

const achievementsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateEarned: { type: Date, default: Date.now }
});

// Main user schema
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    prefix: { type: String, default: 'P' },
    balance: {
        coin: { type: Number, default: 0 },
        bank: { type: Number, default: 0 }
    },
    peachy: {
        streak: { type: Number, default: 0 }
    },
    profile: {
        username: String,
        gender: String,
        bio: String,
        birthday: Date,
        birthdayAcknowledged: { type: Boolean, default: false },
        xp: { type: Number, default: 0 },
        lastXpGain: { type: Number, default: 1 },
        level: { type: Number, default: 1 }
    },
    relationship: {
        partner: { type: String, default: null },
        bros: [inventorySchema],
        besties: [inventorySchema],
        confidants: [inventorySchema]
    },
    social: {
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
        twitter: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
        linkedin: {
            name: { type: String, default: null },
            link: { type: String, default: null },
        },
    },
    inventory: [inventorySchema],
    equal: [equalSchema],
    cooldown: [cooldownSchema],
    dailyLimit: dailyLimitSchema,
    dailyTask: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['peach', 'transfer'], required: true },
        progress: { type: Number, default: 0 },
        requiredAmount: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
    }],
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' },
    },
    verification: {
        code: String,
        status: { type: String, default: 'unverified' },
        warnings: [{
            reason: String,
            date: { type: Date, default: Date.now },
            issuedBy: String
        }],
        isBanned: { type: Boolean, default: false },
        banReason: { type: String, default: null },
        spamCount: { type: Number, default: 0 },
        lastSpamCheck: { type: Date, default: Date.now }
    },
    activity: {
        lastLogin: { type: Date, default: Date.now },
        totalMessagesSent: { type: Number, default: 0 }
    },
    achievements: [achievementsSchema]
});

module.exports = mongoose.model('User', userSchema);
