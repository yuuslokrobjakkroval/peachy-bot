const { model, Schema } = require("mongoose");

const LevelingMessagesSchema = new Schema(
  {
    id: { type: String, default: null, index: true },
    channel: { type: String, default: null },
    content: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

module.exports = model("levelings", LevelingMessagesSchema);
