const { model, Schema } = require('mongoose');

const FeedBackSchema = new Schema({
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 10 },
    feedback: { type: String, required: false },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('feedback', FeedBackSchema);
