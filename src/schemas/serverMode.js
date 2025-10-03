const { model, Schema } = require("mongoose");

const ServerModeSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    mode: {
      type: String,
      enum: ["global", "private"],
      default: "global",
      required: true,
    },
    enabledBy: { type: String, required: true }, // User ID who set this mode
    enabledAt: { type: Date, default: Date.now },
    settings: {
      // Configuration for private mode
      allowDataImport: { type: Boolean, default: false }, // Allow importing global data when switching to private
      allowDataExport: { type: Boolean, default: false }, // Allow exporting private data when switching to global
      resetOnSwitch: { type: Boolean, default: false }, // Reset all data when switching modes
      backupOnSwitch: { type: Boolean, default: true }, // Create backup before switching
    },
    statistics: {
      totalSwitches: { type: Number, default: 0 },
      lastSwitched: { type: Date, default: null },
      switchHistory: [
        {
          fromMode: { type: String, enum: ["global", "private"] },
          toMode: { type: String, enum: ["global", "private"] },
          switchedBy: { type: String },
          switchedAt: { type: Date, default: Date.now },
          reason: { type: String, default: null },
        },
      ],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model("ServerMode", ServerModeSchema);
