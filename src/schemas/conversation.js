const { model, Schema } = require("mongoose");

const conversationSchema = new Schema({
	_id: { type: String, default: "global" }, // Global conversation
	messages: [
		{
			userId: String, // Track who sent it
			content: String,
			fromBot: Boolean,
			timestamp: { type: Date, default: Date.now },
		},
	],
});

module.exports = model("conversations", conversationSchema);
