const { Schema, model } = require('mongoose');

const Chat = new Schema({
    contact: [Schema.Types.ObjectId],
}, { versionKey: false })

module.exports = model('Chat', Chat);