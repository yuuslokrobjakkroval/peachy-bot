const { model, Schema } = require("mongoose");

const AntiLinkSchema = new Schema(
  {
    guild: {
      type: String,
      required: true,
    },
    perms: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

module.exports = model("antilink", AntiLinkSchema);
