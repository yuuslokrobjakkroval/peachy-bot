const { model, Schema } = require('mongoose');

const ServerTemplateSchema = new Schema(
    {
        templateId: { type: String, required: true, unique: true, index: true },
        emoji: { type: String, default: '🎮' },
        title: { type: String, required: true },
        description: { type: String, required: true },
        fullDescription: { type: String, default: null },
        tags: { type: [String], default: [] },
        upvotes: { type: Number, default: 0 },
        uses: { type: Number, default: 0 },
        featured: { type: Boolean, default: false },
        creator: { type: String, required: true },
        creatorId: { type: String, default: null },
        features: { type: [String], default: [] },
        channels: { type: Number, default: 0 },
        roles: { type: Number, default: 0 },

        // Template configuration
        config: {
            language: { type: String, default: 'en' },
            prefix: { type: String, default: '!' },
            defaultRole: { type: String, default: null },
            modRole: { type: String, default: null },
            adminRole: { type: String, default: null },
        },

        // Channel templates
        channelTemplates: [
            {
                name: { type: String, required: true },
                type: { type: String, enum: ['text', 'voice', 'category'], required: true },
                description: { type: String, default: null },
                position: { type: Number, default: 0 },
                category: { type: String, default: null },
                nsfw: { type: Boolean, default: false },
            },
        ],

        // Role templates
        roleTemplates: [
            {
                name: { type: String, required: true },
                color: { type: String, default: '#000000' },
                hoist: { type: Boolean, default: false },
                permissions: { type: [String], default: [] },
                position: { type: Number, default: 0 },
            },
        ],

        // Statistics
        statistics: {
            totalDownloads: { type: Number, default: 0 },
            totalViews: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0, min: 0, max: 5 },
            downloads: { type: [{ type: Date }], default: [] },
        },

        // Content
        thumbnail: { type: String, default: null },
        previewImages: { type: [String], default: [] },
        category: { type: String, default: 'General' },

        // Status
        isPublished: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },

        // Engagement
        ratings: [
            {
                userId: { type: String, required: true },
                rating: { type: Number, required: true, min: 1, max: 5 },
                review: { type: String, default: null },
                ratedAt: { type: Date, default: Date.now },
            },
        ],

        reviews: [
            {
                userId: { type: String, required: true },
                username: { type: String, default: null },
                comment: { type: String, required: true },
                helpful: { type: Number, default: 0 },
                unhelpful: { type: Number, default: 0 },
                createdAt: { type: Date, default: Date.now },
            },
        ],

        // Moderation
        isBlacklisted: { type: Boolean, default: false },
        blacklistReason: { type: String, default: null },
        reportCount: { type: Number, default: 0 },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
        collection: 'serverTemplates',
    }
);

// Index for better query performance
ServerTemplateSchema.index({ creator: 1, createdAt: -1 });
ServerTemplateSchema.index({ featured: 1, upvotes: -1 });
ServerTemplateSchema.index({ tags: 1 });
ServerTemplateSchema.index({ category: 1 });

module.exports = model('serverTemplate', ServerTemplateSchema);
