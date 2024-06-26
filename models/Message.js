const { Schema, model } = require('mongoose');

const Message = new Schema({
    text: String,
    chat: Schema.Types.ObjectId,
    user: Schema.Types.ObjectId,
    created: Date,
    edit: Boolean,
    type: String
}, { versionKey: false })

module.exports = model('Message', Message);