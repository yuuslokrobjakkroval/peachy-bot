const { model, Schema } = require('mongoose');

const JoinCreateSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    channelId: { type: String, default: null },
    categoryId: { type: String, default: null },
    defaultUserLimit: { type: Number, default: 0 },
    tempChannels: [{
        channelId: { type: String, default: null },
        ownerId: { type: String, default: null },
        locked: { type: String, default: null },
        hidden: { type: String, default: null },
        blockedUsers: [{ type: [String], default: [] }],
    }],
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('jointocreates', JoinCreateSchema);
