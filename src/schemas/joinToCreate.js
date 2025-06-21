const { model, Schema } = require("mongoose");

const JoinToCreateSchema = new Schema(
  {
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    voiceLimit: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model("jointocreate", JoinToCreateSchema);
