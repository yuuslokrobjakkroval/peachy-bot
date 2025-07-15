// models/Friend.js
const { Schema, model } = require("mongoose");

const RelationshipSchema = new Schema({
  userId: { type: String, required: true },      // The one who initiated or owns this entry
  friendId: { type: String, required: true },    // The other person in the relationship
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "blocked"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["partner", "brother", "sister", "bestie", "confidant", "friend", "crush"],
    default: "friend",
  },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  requestedBy: { type: String }, // userId of who sent the request
});

module.exports = model("relationship", RelationshipSchema);