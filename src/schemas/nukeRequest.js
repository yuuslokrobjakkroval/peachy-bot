const { model, Schema } = require('mongoose');

const NukeRequestSchema = new Schema(
    {
        requestId: { type: String, required: true, unique: true, index: true },
        guildId: { type: String, required: true, index: true },
        guildName: { type: String, required: true },
        userId: { type: String, required: true },
        username: { type: String, required: true },
        userTag: { type: String, required: true },
        reason: { type: String, default: 'No reason provided' },

        // Request status
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'executed'],
            default: 'pending',
        },

        // Approval info
        approvedBy: { type: String, default: null },
        approverUsername: { type: String, default: null },
        approverTag: { type: String, default: null },
        rejectionReason: { type: String, default: null },

        // Server data (snapshot before nuke)
        channelCount: { type: Number, default: 0 },
        roleCount: { type: Number, default: 0 },
        memberCount: { type: Number, default: 0 },

        // Timestamps
        requestedAt: { type: Date, default: Date.now },
        approvedAt: { type: Date, default: null },
        executedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

// Index for queries
NukeRequestSchema.index({ guildId: 1, status: 1 });
NukeRequestSchema.index({ userId: 1, status: 1 });
NukeRequestSchema.index({ status: 1, expiresAt: 1 });

module.exports = model('nukeRequest', NukeRequestSchema);
