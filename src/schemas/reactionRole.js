const { Schema, model } = require('mongoose');

const RelationshipSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    embed: {
        title: { type: String, default: 'React to get a role!' },
        description: { type: String, default: 'Choose a reaction to receive the corresponding role.' },
        color: { type: String, default: '#0099ff' },
        image: { type: String, default: null },
        thumbnail: { type: String, default: null },
    },
    options: [
        {
            label: { type: String, default: 'Select a role' },
            roleId: { type: String, default: null },
            emoji: {
                id: { type: String },
                name: { type: String },
                animated: { type: Boolean },
            },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = model('reactionRole', RelationshipSchema);
