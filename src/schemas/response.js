const { model, Schema } = require('mongoose');

const ResponseSchema = new Schema({
    guildId: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    autoresponse: [
        {
            trigger: { type: String, required: true, minlength: 1 },
            response: { type: String, required: true, minlength: 1 }
        }
    ]
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('responses', ResponseSchema);
