const { Schema, model } = require("mongoose");

const TreeSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    tree: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 0 },
      stage: {
        type: String,
        enum: ["Seed", "Sprout", "Sapling", "Tree", "Great Tree"],
        default: "Seed",
      },
      lastWatered: { type: Date, default: 0 },
    },
    coins: { type: Number, default: 0 },
    upgrades: {
      fertilizer: { type: Boolean, default: false },
      rain: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = model("tree", TreeSchema);
