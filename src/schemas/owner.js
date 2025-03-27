const { model, Schema } = require("mongoose");

const ownerSchema = new Schema(
  { ownerId: { type: String, required: true, index: true } },
  { timestamps: true }
);

module.exports = model("owners", ownerSchema);
