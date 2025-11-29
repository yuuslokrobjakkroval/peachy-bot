const { model, Schema } = require("mongoose");

const SendMessageSchema = new Schema(
	{
		guild: { type: String, default: null },
		userId: { type: String, default: null },
		feature: { type: String, default: null },
		isActive: { type: Boolean, default: false },
	},
	{ timestamps: { createdAt: true, updatedAt: true } },
);

module.exports = model("sendmessages", SendMessageSchema);
