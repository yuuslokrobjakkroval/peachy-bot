const { model, Schema } = require("mongoose");
const globalConfig = require('../utils/Config');

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

// ConsumedItemSchema
const ConsumedItemSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: null },
    quantity: { type: Number, default: 1 },
    lastConsumedAt: { type: Date, default: Date.now }
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
    bio: { type: String, default: null, maxlength: 300 },
    birthday: { type: String, default: null },
    birthdayAcknowledged: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    levelXp: { type: Number, default: 1000 },
    lastXpGain: { type: Number, default: 0 },
    visibility: {
        status: { type: Boolean, default: false },
        message: { type: String, default: null }
    },
    likes: { type: [String], default: [] },
    zodiacSign: { type: String, default: null }
});

// Verification Schema
const VerificationSchema = new Schema({
    code: { type: String },
    verify: {
        payment: { type: String, default: 'unpaid' },
        status: { type: String, default: 'unverified' },
        code: { type: String, default: null },
        message: { type: String, default: null }
    },
    warnings: [{
        reason: { type: String },
        date: { type: Date, default: Date.now },
        issuedBy: { type: String }
    }],
    timeout: {
        expiresAt: { type: Date, default: null },
        reason: { type: String, default: null }
    },
    isBanned: { type: Boolean, default: false },
    isBlacklist: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    spamCount: { type: Number, default: 0 },
    lastSpamCheck: { type: Date, default: Date.now }
});

// Work Schema
const WorkSchema = new Schema({
    position: { type: String, default: 'Not yet applied' },
    status: { type: String, default: 'pending' },  // 'pending', 'approved', 'rejected'
    applyDate: { type: Date, default: Date.now },
    approvedDate: { type: Date, default: null },
    salary: { type: Number, default: 0 },
    lastWorkedAt: { type: Date, default: null },
    workCooldown: { type: Number, default: 0 }, // stores timestamp
    jobHistory: [{
        position: String,
        appliedAt: Date,
        approvedAt: Date,
        completedTasks: Number,
    }],
    currentTask: { type: String, default: null },
    performanceRating: { type: Number, default: 0 },
    workStreak: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    rejections: { type: Number, default: 0 },
    rejectionReason: { type: String, default: null },
    lastPromotion: { type: Date, default: null },
    promotionHistory: [{
        position: String,
        promotedAt: Date,
    }],
    isWorking: { type: Boolean, default: false },
    workDuration: { type: Number, default: 0 },  // duration in minutes or hours
    specialBonuses: [{
        type: String,
        value: Number,
        appliedAt: Date
    }]
});

// Relationship Schema
const RelationshipSchema = new Schema({
    partner: {
        userId: { type: String, default: null },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    },
    brothers: [{
        userId: { type: String, default: null },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    sisters: [{
        userId: { type: String, default: null },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    besties: [{
        userId: { type: String, default: null },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }],
    confidants: [{
        userId: { type: String, default: null },
        name: { type: String, default: null },
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    }]
});

const AchievementsSchema = new Schema({
    name: { type: String, required: true },
    dateEarned: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    prefix: { type: String, default: globalConfig.prefix },
    work: { type: WorkSchema, default: () => ({}) },
    verification: { type: VerificationSchema, default: () => ({}) },
    balance: {
        coin: { type: Number, default: 500000 },
        bank: { type: Number, default: 0 },
        sponsor: { type: Number, default: 0 },
    },
    peachy: {
        streak: { type: Number, default: 0 }
    },
    goma: {
        streak: { type: Number, default: 0 }
    },
    profile: { type: ProfileSchema, default: () => ({}) },
    relationship: { type: RelationshipSchema, default: () => ({}) },
    inventory: { type: [InventoryItemSchema], default: [] },
    equip: { type: [EquipItemSchema], default: [] },
    consumedItems: { type: [ConsumedItemSchema], default: [] },
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
        language: { type: String, default: globalConfig.language.defaultLocale },
        notifications: { type: Boolean, default: true },
        theme: { type: String, default: 'normal' },
    },
    activity: {
        lastLogin: { type: Date, default: Date.now },
        totalMessagesSent: { type: Number, default: 0 }
    },
    achievements: { type: [AchievementsSchema], default: [] }
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('user', userSchema);
