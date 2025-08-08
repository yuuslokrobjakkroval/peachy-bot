const { model, Schema } = require("mongoose");
const globalConfig = require("../utils/Config");

// AnimalSchema
const AnimalSchema = new Schema({
  id: { type: String, required: true },
  level: { type: Number, default: 1 },
  levelXp: { type: Number, default: 120 },
  lastXpGain: { type: Number, default: 0 },
});

// SoldPetSchema
const SoldPetSchema = new Schema({
  id: { type: String, required: true }, // e.g., "bubbles"
  level: { type: Number, required: true }, // Level at the time of sale
  soldAt: { type: Date, default: Date.now }, // Timestamp of when the pet was sold
});

const SponsorTransactionSchema = new Schema({
  amount: { type: Number, required: true },
  recipientId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// InventoryItemSchema
const InventoryItemSchema = new Schema({
  id: { type: String, required: true },
  quantity: { type: Number, default: 1 },
});

// EquipItemSchema
const EquipItemSchema = new Schema({
  id: { type: String, required: true },
  quantity: { type: Number, default: 1 },
});

// ConsumedItemSchema
const ConsumedItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: null },
  quantity: { type: Number, default: 1 },
  lastConsumedAt: { type: Date, default: Date.now },
});

// CooldownSchema
const CooldownSchema = new Schema({
  name: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
  duration: { type: Number, required: true },
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
  levelXp: { type: Number, default: 100 },
  lastXpGain: { type: Number, default: 0 },
  voiceXP: { type: Number, default: 0 },
  voiceLevel: { type: Number, default: 1 },
  voiceLevelXp: { type: Number, default: 100 },
  lastVoiceXpGain: { type: Number, default: 0 },
  lastVoiceActivity: { type: Date },
  visibility: {
    status: { type: Boolean, default: false },
    message: { type: String, default: null },
  },
  likes: { type: [String], default: [] },
  zodiacSign: { type: String, default: null },
});

// Verification Schema
const VerificationSchema = new Schema({
  code: { type: String },
  verify: {
    payment: { type: String, default: "unpaid" },
    status: { type: String, default: "unverified" },
    code: { type: String, default: null },
    message: { type: String, default: null },
  },
  warnings: [
    {
      reason: { type: String },
      date: { type: Date, default: Date.now },
      issuedBy: { type: String },
    },
  ],
  timeout: {
    expiresAt: { type: Date, default: null },
    reason: { type: String, default: null },
  },
  isBanned: { type: Boolean, default: false },
  isBlacklist: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  spamCount: { type: Number, default: 0 },
  lastSpamCheck: { type: Date, default: Date.now },
});

// Work Schema
const WorkSchema = new Schema({
  position: { type: String, default: "Not yet applied" },
  status: { type: String, default: "pending" }, // 'pending', 'approved', 'rejected'
  applyDate: { type: Date, default: Date.now },
  approvedDate: { type: Date, default: null },
  jobHistory: [
    {
      position: String,
      appliedAt: Date,
      approvedAt: Date,
      completedTasks: Number,
    },
  ],
  performanceRating: { type: Number, default: 0 },
  rejections: { type: Number, default: 0 },
  rejectionReason: { type: String, default: null },
  specialBonuses: [
    {
      type: String,
      value: Number,
      appliedAt: Date,
    },
  ],
  rob: { type: Boolean, default: false },
  robAmount: { type: Number, default: 0 },
});

// Relationship Schema
const RelationshipSchema = new Schema({
  partner: {
    userId: { type: String, default: null },
    name: { type: String, default: null },
    date: { type: Date, default: null },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  brothers: [
    {
      userId: { type: String, default: null },
      name: { type: String, default: null },
      date: { type: Date, default: null },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
    },
  ],
  sisters: [
    {
      userId: { type: String, default: null },
      name: { type: String, default: null },
      date: { type: Date, default: null },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
    },
  ],
  besties: [
    {
      userId: { type: String, default: null },
      name: { type: String, default: null },
      date: { type: Date, default: null },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
    },
  ],
  confidants: [
    {
      userId: { type: String, default: null },
      name: { type: String, default: null },
      date: { type: Date, default: null },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
    },
  ],
});

const AchievementsSchema = new Schema({
  name: { type: String, required: true },
  dateEarned: { type: Date, default: Date.now },
});

// User Schema
const userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    prefix: { type: String, default: globalConfig.prefix },
    work: { type: WorkSchema, default: () => ({}) },
    verification: { type: VerificationSchema, default: () => ({}) },
    balance: {
      coin: { type: Number, default: 25000 },
      bank: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
      sponsor: { type: Number, default: 0 },
      slots: { type: Number, default: 0 },
      blackjack: { type: Number, default: 0 },
      coinflip: { type: Number, default: 0 },
      klaklouk: { type: Number, default: 0 },
    },
    sponsorRank: { type: Number, default: 0 }, // Added: 1-10 for top sponsors, 0 otherwise
    sponsorTransactions: { type: [SponsorTransactionSchema], default: [] }, // Added: Tracks sponsor coin transfers
    lastSponsorReset: { type: Date, default: Date.now }, // Added: Tracks last sponsor reset
    validation: {
      isMultiTransfer: { type: Boolean, default: false },
      isKlaKlouk: { type: Boolean, default: false },
    },
    peachy: {
      streak: { type: Number, default: 0 },
    },
    goma: {
      streak: { type: Number, default: 0 },
    },
    profile: { type: ProfileSchema, default: () => ({}) },
    relationship: { type: RelationshipSchema, default: () => ({}) },
    inventory: { type: [InventoryItemSchema], default: [] },
    equip: { type: [EquipItemSchema], default: [] },
    consumedItems: { type: [ConsumedItemSchema], default: [] },
    cooldowns: { type: [CooldownSchema], default: [] },
    // Credit Banking System
    creditBank: {
      balance: { type: Number, default: 0 },
      lastInterest: { type: Date, default: Date.now },
      totalInterestEarned: { type: Number, default: 0 },
      depositHistory: [
        {
          type: { type: String }, // "deposit", "withdrawal", "interest"
          amount: { type: Number },
          date: { type: Date, default: Date.now },
          balance: { type: Number },
        },
      ],
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
    },
    preferences: {
      language: { type: String, default: globalConfig.language.defaultLocale },
      notifications: { type: Boolean, default: true },
      theme: { type: String, default: "normal" },
    },
    activity: {
      lastLogin: { type: Date, default: Date.now },
      totalMessagesSent: { type: Number, default: 0 },
    },
    zoo: { type: [AnimalSchema], default: [] },
    sellPetCount: { type: Number, default: 0 }, // Tracks number of pets sold
    feedCount: { type: Number, default: 0 }, // Tracks number of times pets are fed
    soldPets: { type: [SoldPetSchema], default: [] }, // Tracks history of sold pets
    achievements: { type: [AchievementsSchema], default: [] },
    isDailyClaim: { type: Boolean, default: false },
    gathering: {
      mine: { type: Boolean, default: false },
      chop: { type: Boolean, default: false },
      slime: { type: Boolean, default: false },
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model("user", userSchema);
