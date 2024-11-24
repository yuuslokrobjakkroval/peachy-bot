const { model, Schema } = require('mongoose');

const SendMessageSchema = new Schema({
    guild: { type: String, required: true },
    userId: { type: String, required: true },
    feature: { type: String, required: true },
    isActive: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('sendmessages', SendMessageSchema);
