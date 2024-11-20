const { model, Schema } = require('mongoose');

const JoinRolesSchema = new Schema({
    id: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    userRoles: { type: [String], default: [] },
    botRoles: { type: [String], default: [] },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('joinroles', JoinRolesSchema);
