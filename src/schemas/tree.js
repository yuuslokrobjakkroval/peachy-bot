const { Schema, model } = require("mongoose");

const TreeSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    tree: {
      name: { type: String, required: true },
      height: { type: Number, default: 1 },
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 0 },
      lastWatered: { type: Date, default: 0 },
      waterCount: { type: Number, default: 0 },
      lastWateredBy: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = model("tree", TreeSchema);
