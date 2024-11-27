const { model, Schema } = require('mongoose');

const UserVotesSchema = new Schema({
    userId: { type: String, default: null },
    lastVotedAt: { type: Date, default: Date.now },
    totalVotes: { type: Number, default: 0 },
    rewarded: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('uservotes', UserVotesSchema);
