const { model, Schema } = require("mongoose");

const MessageSchema = new Schema({
	author: {
		name: { type: String, default: "" },
		iconURL: { type: String, default: "" },
		url: { type: String, default: "" },
	},
	url: { type: String, default: "" },
	color: { type: Number, default: 0 },
	title: { type: String, default: "" },
	thumbnail: { type: String, default: "" },
	description: { type: String, default: "" },
	image: { type: String, default: "" },
	fields: [
		{
			name: { type: String, default: "" },
			value: { type: String, default: "" },
			inline: { type: Boolean, default: false },
		},
	],
	footer: {
		text: { type: String, default: "" },
		iconURL: { type: String, default: "" },
	},
});

const ImageSchema = new Schema({
	layout: { type: String, default: null },
	avatarShape: { type: String, default: null },
	circleColor: { type: String, default: "#DFF2EB" },
	feature: { type: String, default: null },
	featureColor: { type: String, default: "#00D1D1" },
	usernameColor: { type: String, default: "#333333" },
	backgroundImage: { type: String, default: null },
	message: { type: String, default: null },
	messageColor: { type: String, default: "#333333" },
});

const GoodByeMessagesSchema = new Schema(
	{
		id: { type: String, default: null, index: true },
		channel: { type: String, default: null },
		content: { type: String, default: "" },
		message: { type: MessageSchema, default: () => ({}) },
		image: { type: ImageSchema, default: () => ({}) },
		isActive: { type: Boolean, default: true },
		isEmbed: { type: Boolean, default: false },
		isCustomImage: { type: Boolean, default: true },
	},
	{ timestamps: { createdAt: true, updatedAt: true } },
);

module.exports = model("goodbyemessages", GoodByeMessagesSchema);
