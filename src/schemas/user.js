const { model, Schema } = require("mongoose");

const userSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: '' },
    gender: {type: String, default: ''},
    bio: {type: String, default: ''},
    relationshipStatus: { type: String, default: ''},
    relationshipPartnerId: {type: String, default: ''},
    dateOfStartRelationShip: {type: String, default: ''},
    balance: { type: Number, default: 0 },
    balanceLimit: { type: Number, default: 0 },
    balanceMainLimit: { type: Number, default: 0 },
    bg: { type: Array },
    levelSystem: {
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 0 },
        rateXp: { type: Number, default: 100 },
    },
    dailySystem: {
        Daily: { type: Date, default: '' },
        dailyStack: { type: Number, default: 1 },
    },
    workSystem: {
        job: { type: String, default: '' },
    },
});

module.exports = model("User", userSchema);