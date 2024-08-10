const { model, Schema } = require("mongoose");

const userSchema = new Schema({

    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    gender: {type: String, default: ''},
    about_me: {type: String, default: ''},
    relationship_partner_id: {type: String, default: ''},
    date_of_start_relationship: {type: String, default: ''},
    balance_limit: { type: Number, default: 0 },
    balance_main_limit: { type: Number, default: 0 },
    command_point: { type: Number, default: 0 },
    next_day: { type: Date, default: '' },
    username: { type: String, default: '' },
    shard: { type: Number, default: 0 },
    bg: { type: Array },
    lvl_bg: {type: String, default: ''},
    spam_amount: { type: Number, default: 0 },
    elo: { type: Number, default: 0 },
    CD: { type: Boolean, default: false },
    daily_crate: { type: Number, default: 0 },

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

    holder_item: {
        holder_item_bool: { type: Boolean, default: false },
        holder_item_equipe: { type: String, default: '' },
    },
});

module.exports = model("User", userSchema);