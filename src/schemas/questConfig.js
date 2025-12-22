/**
 * @namespace: schemas/questConfig.js
 * @type: Database Schema
 * @description Quest Notifier configuration schema
 */

const { model, Schema } = require('mongoose');

const QuestConfigSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        channelId: {
            type: String,
            required: true,
        },
        roleId: {
            type: String,
            default: null,
        },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model('questconfig', QuestConfigSchema);
