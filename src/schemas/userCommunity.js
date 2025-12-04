const { model, Schema } = require('mongoose');

const UserCommunitySchema = new Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        role: { type: String, enum: ['Owner', 'Developer', 'Staff', 'Partnership'], required: true },

        // Owner Information
        owner: {
            joinedDate: { type: Date, default: null },
            permissions: [{ type: String }],
            notes: { type: String, default: '' },
        },

        // Developer Information
        developer: {
            joinedDate: { type: Date, default: null },
            specialization: { type: String, default: '' }, // e.g., "Backend", "Frontend", "DevOps"
            projects: [{ type: String }],
            contributions: { type: Number, default: 0 },
            notes: { type: String, default: '' },
        },

        // Staff Information
        staff: {
            joinedDate: { type: Date, default: null },
            position: { type: String, default: '' }, // e.g., "Moderator", "Support", "Manager"
            department: { type: String, default: '' }, // e.g., "Support", "Moderation", "Community"
            status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
            notes: { type: String, default: '' },
        },

        // Partnership Information
        partnership: {
            joinedDate: { type: Date, default: null },
            companyName: { type: String, default: '' },
            partnershipType: { type: String, default: '' }, // e.g., "Sponsor", "Collaborator", "Affiliate"
            contactPerson: { type: String, default: '' },
            contactEmail: { type: String, default: '' },
            agreement: { type: String, default: '' },
            notes: { type: String, default: '' },
        },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = model('usercommunity', UserCommunitySchema);
