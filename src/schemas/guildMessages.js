const { model, Schema } = require('mongoose');

const GuildMessagesSchema = new Schema(
    {
        guildId: { type: String, required: true, unique: true, index: true },
        totalMessages: { type: Number, default: 0 },
        messageCount: {
            daily: { type: Number, default: 0 },
            weekly: { type: Number, default: 0 },
            monthly: { type: Number, default: 0 },
        },
        channelStats: [
            {
                channelId: { type: String, required: true },
                messageCount: { type: Number, default: 0 },
                lastMessageAt: { type: Date, default: null },
            },
        ],
        userStats: [
            {
                userId: { type: String, required: true },
                messageCount: { type: Number, default: 0 },
                lastMessageAt: { type: Date, default: null },
            },
        ],
        statistics: {
            lastMessageAt: { type: Date, default: null },
            lastResetAt: { type: Date, default: Date.now },
            averageMessagesPerDay: { type: Number, default: 0 },
            peakHour: { type: Number, default: null }, // 0-23
        },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model('guildMessages', GuildMessagesSchema);
