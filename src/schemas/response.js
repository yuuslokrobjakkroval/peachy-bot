const { model, Schema } = require('mongoose');

const ResponseSchema = new Schema({
    guildId: { type: String, default: null, index: true },
    autoresponse: [
        {
            id: { type: String, required: true, unique: true },  // Adding custom id field in autoresponse array
            trigger: { type: String, required: true, minlength: 1 },
            response: { type: String, required: true, minlength: 1 }
        }
    ]
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('Response', ResponseSchema);
