const { model, Schema } = require("mongoose");

const ownerSchema = new Schema(
  {
    user: {
      id: { type: String, required: true, index: true }, // Discord user ID
      username: { type: String, required: true }, // User's current username
      discriminator: { type: String }, // Legacy discriminator (e.g., "0")
      global_name: { type: String }, // User's display name
      avatar: { type: String }, // Avatar hash
      banner: { type: String }, // Banner hash
      accent_color: { type: Number }, // Numeric accent color
      banner_color: { type: String }, // Hex color (e.g., "#704d25")
    },
  },
  { timestamps: true }
);

module.exports = model("owners", ownerSchema);
