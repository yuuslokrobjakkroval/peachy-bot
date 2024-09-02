const { model, Schema } = require('mongoose');

const GiveawaySchema = new Schema({
    guildId: { type: String, default: null },
    channelId: { type: String, default: null },
    messageId: { type: String, required: true, unique: true },
    winners: { type: Number, default: 1 },
    prize: { type: Number, default: 0 },
    endTime: { type: String, default: null },
    paused: { type: Boolean, default: false },
    ended: { type: Boolean, default: false },
    hostedBy: { type: String, default: null },
    entered: { type: Array, default: [] },
});
module.exports = model('giveaway', GiveawaySchema);

