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
    username: { type: String, default: null },
    gender: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 200 },
    birthday: { type: String, default: null },
    birthdayAcknowledged: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    levelXp: { type: Number, default: 1000 },
    lastXpGain: { type: Number, default: 0 },
    visibility: { status: { type: Boolean, default: false }, message: { type: String, default: null }} ,
    likes: { type: [String], default: [] }
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
        id: { type: String, default: null },  // Change required: true to default: null
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    },
    brothers: [{
        id: { type: String, default: null },  // Also change these to default: null if necessary
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    sisters: [{
        id: { type: String, default: null },  // Also change these to default: null if necessary
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    besties: [{
        id: { type: String, default: null },  // Also change these to default: null if necessary
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    confidants: [{
        id: { type: String, default: null },  // Also change these to default: null if necessary
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
    prefix: { type: String, default: config.prefix },
    verification: { type: VerificationSchema, default: () => ({}) },
    balance: {
        coin: { type: Number, default: 500000 },
        bank: { type: Number, default: 0 }
    },
    peachy: {
        streak: { type: Number, default: 0 }
    },
    // quest: [{
    //     id: { type: String, required: true },
    //     type: { type: String, enum: ['peach', 'transfer'], required: true },
    //     progress: { type: Number, default: 0 },
    //     requiredAmount: { type: Number, default: 0 },
    //     completed: { type: Boolean, default: false },
    // }],
    profile: { type: ProfileSchema, default: () => ({}) },
    relationship: RelationshipSchema,
    inventory: { type: [InventoryItemSchema], default: [] },
    equip: { type: [EquipItemSchema], default: [] },
    cooldowns: { type: [CooldownSchema], default: [] },
    social: {
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
    },
    preferences: {
        language: { type: String, default: config.language.defaultLocale },
        notifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['peach', 'goma', 'normal'], default: 'peach' },
    },
    activity: {
        lastLogin: { type: Date, default: Date.now },
        totalMessagesSent: { type: Number, default: 0 }
    },
    achievements: { type: [achievementsSchema], default: [] }
});

module.exports = model('user', userSchema);
