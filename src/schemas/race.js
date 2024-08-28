const mongoose = require('mongoose');

const raceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    rabbit: {
        type: Number,
        default: 0
    },
    turtle: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Race', raceSchema);
