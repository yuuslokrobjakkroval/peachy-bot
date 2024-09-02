const { model, Schema } = require("mongoose");
const config = require('../config.js');

// InventoryItemSchema
const InventoryItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, default: null },
    quantity: { type: Number, default: 1 }
});

// EquipItemSchema
const EquipItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, default: null },
    quantity: { type: Number, default: 1 }
});

// CooldownSchema
const CooldownSchema = new Schema({
    name: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    duration: { type: Number, required: true }
});

// Profile Schema
const ProfileSchema = new Schema({
    bio: { type: String, default: null, maxlength: 200 },
    birthday: { type: String, default: null },
    birthdayAcknowledged: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastXpGain: { type: Number, default: 0 },
    likes: { type: [String], default: [] }
});

// Social Schema
const SocialSchema = new Schema({
    facebook: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    instagram: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    },
    tiktok: {
        name: { type: String, default: null },
        link: { type: String, default: null }
    }
});

// Verification Schema
const VerificationSchema = new Schema({
    code: { type: String },
    status: { type: String, default: 'unverified' },
    warnings: [{
        reason: { type: String },
        date: { type: Date, default: Date.now },
        issuedBy: { type: String }
    }],
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    spamCount: { type: Number, default: 0 },
    lastSpamCheck: { type: Date, default: Date.now }
});

// Relationship Schema
const RelationshipSchema = new Schema({
    partner: {
        id: { type: String,  required: true },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    },
    brothers: [{
        id: { type: String,  required: true },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    sisters: [{
        id: { type: String,  required: true },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    besties: [{
        id: { type: String,  required: true },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    confidants: [{
        id: { type: String,  required: true },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }]
});

const achievementsSchema = new Schema({
    name: { type: String, required: true },
    dateEarned: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    gender: { type: String, default: null },
    prefix: { type: String, default: config.prefix },
    language: { type: String, default: config.language.defaultLocale },
    verification: VerificationSchema,
    balance: {
        coin: { type: Number, default: 0 },
        bank: { type: Number, default: 0 }
    },
    dailyLimits: {
        lastReset: { type: Date, default: Date.now },
        transferUsed: { type: Number, default: 0 },
        receiveUsed: { type: Number, default: 0 },
        transferLimit: { type: Number, default: 64000 },
        receiveLimit: { type: Number, default: 64000 }
    },
    peachy: {
        streak: { type: Number, default: 0 }
    },
    quest: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['daily', 'weekly'], required: true },
        progress: { type: Number, default: 0 },
        requiredAmount: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
    }],
    profile: ProfileSchema,
    relationship: RelationshipSchema,
    inventory: { type: [InventoryItemSchema], default: [] },
    equip: { type: [EquipItemSchema], default: [] },
    cooldowns: { type: [CooldownSchema], default: [] },
    social: SocialSchema,
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' },
    },
    activity: {
        lastLogin: { type: Date, default: Date.now },
        totalMessagesSent: { type: Number, default: 0 }
    },
    achievements: [achievementsSchema]
});

module.exports = model('user', userSchema);
