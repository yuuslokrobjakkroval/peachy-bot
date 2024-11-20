const { model, Schema } = require('mongoose');

const MessageSchema = new Schema({
    author: {
        name: { type: String, default: '' },
        iconURL: { type: String, default: '' },
        url: { type: String, default: '' },
    },
    url: { type: String, default: '' },
    color: { type: Number, default: 0 },
    title: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    fields: [{
        name: { type: String, default: '' },
        value: { type: String, default: '' },
        inline: { type: Boolean, default: false },
    }],
    footer: {
        text: { type: String, default: '' },
        iconURL: { type: String, default: '' },
    },
});

const InviteTrackerMessageSchema = new Schema({
    id: { type: String, default: null, index: true },
    channel: { type: String, default: null },
    content: { type: String, default: '' },
    message: { type: MessageSchema, default: () => ({})},
    isActive: { type: Boolean, default: true },
    isEmbed: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('invitetrackermessages', InviteTrackerMessageSchema);
