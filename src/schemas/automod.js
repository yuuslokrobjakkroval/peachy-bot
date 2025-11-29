const { model, Schema } = require('mongoose');

// Automod Schema - Simplified to match existing data structure
const AutomodSchema = new Schema(
    {
        guildId: { type: String, required: true, unique: true, index: true },
        isActive: { type: Boolean, default: true },

        // Feature Toggles (Simple boolean for enable/disable)
        antiSpam: { type: Boolean, default: false },
        antiLinks: { type: Boolean, default: false },
        antiBadwords: { type: Boolean, default: false },
        antiMentionSpam: { type: Boolean, default: false },
        antiAllCaps: { type: Boolean, default: false },
        antiEmojiSpam: { type: Boolean, default: false },
        antiZalgo: { type: Boolean, default: false },
        antiInvites: { type: Boolean, default: false },

        // Bad Words Management
        badWordsList: { type: [String], default: [] },
        badWordsWhitelist: { type: [String], default: [] },

        // Whitelist Management
        whitelistedUsersRoles: { type: [String], default: [] },

        // Exception Channels
        exceptionChannels: { type: [String], default: [] },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model('automod', AutomodSchema);
