/**
 * @namespace: schemas/questGuildLog.js
 * @type: Database Schema
 * @description Quest Guild Log schema - tracks which quests have been sent to which guilds
 */

const { model, Schema } = require('mongoose');

const QuestGuildLogSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            index: true,
        },
        questId: {
            type: String,
            required: true,
            index: true,
        },
    },
    { timestamps: { createdAt: true } }
);

// Compound index for faster queries
QuestGuildLogSchema.index({ guildId: 1, questId: 1 }, { unique: true });

module.exports = model('questguildlog', QuestGuildLogSchema);
