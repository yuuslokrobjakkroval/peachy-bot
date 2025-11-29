const { model, Schema } = require("mongoose");

const ServerStatsChannelSchema = new Schema({
	channelId: { type: String, required: true },
	type: { type: String, required: true }, // members, bots, boosts, etc.
	format: { type: String, required: true }, // Display format template
	isActive: { type: Boolean, default: true },
	lastUpdated: { type: Date, default: Date.now },
});

const ServerStatsSchema = new Schema(
	{
		guildId: { type: String, required: true, unique: true },
		categoryId: { type: String, default: null }, // Category channel ID
		channels: [ServerStatsChannelSchema],
		settings: {
			updateInterval: { type: Number, default: 10 }, // Minutes
			isEnabled: { type: Boolean, default: true },
			autoDelete: { type: Boolean, default: true }, // Auto delete if channel is deleted
		},
		statistics: {
			totalUpdates: { type: Number, default: 0 },
			lastUpdate: { type: Date, default: null },
			createdAt: { type: Date, default: Date.now },
			createdBy: { type: String, default: null }, // User ID who created
		},
	},
	{ timestamps: { createdAt: true, updatedAt: true } },
);

// Index for efficient queries
// Unique on guildId already creates an index; avoid duplicate index
ServerStatsSchema.index({ "channels.channelId": 1 });

module.exports = model("ServerStats", ServerStatsSchema);
