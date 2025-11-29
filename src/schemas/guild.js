const { model, Schema } = require("mongoose");
const globalConfig = require("../utils/Config");

const BanSchema = new Schema({
	userId: { type: String, required: true },
	reason: { type: String, default: "No reason provided" },
	bannedBy: { type: String, required: true },
	bannedAt: { type: Date, default: Date.now },
	isPermanent: { type: Boolean, default: true },
	expiresAt: { type: Date, default: null },
});

const GuildSchema = new Schema(
	{
		guildId: { type: String, required: true, unique: true, index: true },
		name: { type: String, default: null },
		ownerId: { type: String, required: true },
		pfp: { type: String, default: null },
		prefix: { type: String, default: globalConfig.prefix },
		isBlacklisted: { type: Boolean, default: false },
		blacklistReason: { type: String, default: null },
		isBanned: { type: Boolean, default: false },
		bannedReason: { type: String, default: null },
		joinCount: { type: Number, default: 0 },
		leaveCount: { type: Number, default: 0 },
		bans: { type: [BanSchema], default: [] },
		settings: {
			logChannel: { type: String, default: null },
			autoBanBlacklisted: { type: Boolean, default: false },
			language: { type: String, default: globalConfig.language.defaultLocale },
		},
		statistics: {
			lastJoin: { type: Date, default: null },
			lastLeave: { type: Date, default: null },
			lastBan: { type: Date, default: null },
			lastPfpUpdate: { type: Date, default: null },
		},
	},
	{ timestamps: { createdAt: true, updatedAt: true } },
);

module.exports = model("guild", GuildSchema);
