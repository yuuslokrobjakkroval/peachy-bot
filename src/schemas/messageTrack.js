const { model, Schema } = require('mongoose');

const MessageTrackingSchema = new Schema({
    guildId: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    message: [{
        userId: { type: String, require: true},
        userName: { type: String, require: true},
        messageCount: { type: Number, default: 0},
        date: { type: Date, default: Date.now },
    }]
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('messagetracking', MessageTrackingSchema);
