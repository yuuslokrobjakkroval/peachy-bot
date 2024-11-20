const { model, Schema } = require('mongoose');

const MessageSchema = new Schema({
    content: { type: String, default: '' },
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

const GoodByeMessagesSchema = new Schema({
    id: { type: String, default: null, index: true },
    channel: { type: String, default: null },
    message: { type: MessageSchema, default: () => ({})},
    isActive: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('goodbyemessages', GoodByeMessagesSchema);
