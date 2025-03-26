const { model, Schema } = require('mongoose');

const ownerSchema = new Schema({
    id: { type: String, unique: true, required: true, index: true },
    username: { type: String, required: true },
    discriminator: { type: String },
    avatar: { type: String },
    bot: { type: Boolean, default: false },
    system: { type: Boolean, default: false },
    flags: { type: Number },
    accentColor: { type: Number },
    banner: { type: String },
}, { timestamps: true });

module.exports = model('owners', ownerSchema);