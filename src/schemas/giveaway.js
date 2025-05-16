// src/schemas/giveaway.js
const { model, Schema } = require("mongoose");

const GiveawaySchema = new Schema(
  {
    guildId: { type: String, default: null },
    channelId: { type: String, default: null },
    messageId: { type: String, required: true, unique: true },
    winners: { type: Number, default: 1 },
    prize: { type: Number, default: 0 },
    startTime: { type: Number, default: null }, // For scheduled giveaways
    endTime: { type: Number, default: null },
    paused: { type: Boolean, default: false },
    ended: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: false }, // For scheduled giveaways
    hostedBy: { type: String, default: null },
    entered: { type: [String], default: [] },
    autopay: { type: Boolean, default: false },
    retryAutopay: { type: Boolean, default: false },
    winnerId: { type: [String], default: [] },
    rerollOptions: { type: [String], default: [] },
    rerollCount: { type: Number, default: 0 },
    rerolledWinners: { type: [String], default: [] },
    requirements: {
      minLevel: { type: Number, default: 0 },
      requiredRole: { type: String, default: null },
    },
    image: { type: String, default: null },
    thumbnail: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model("giveaways", GiveawaySchema);
