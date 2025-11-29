const { model, Schema } = require("mongoose");

const InviteSchema = new Schema(
	{
		guildId: { type: String, required: true },
		guildName: { type: String, default: null },
		inviteCode: { type: String, required: true, unique: true },
		uses: { type: Number, default: 0 },
		userId: { type: Array, default: [] },
		inviterId: { type: String, required: true },
		inviterTag: { type: String, required: true },
	},
	{ timestamps: { createdAt: true, updatedAt: true } },
);

module.exports = model("invites", InviteSchema);
