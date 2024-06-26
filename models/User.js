const { Schema, model } = require('mongoose');

const User = new Schema({
    name: String,
    sex: String,
    dateBirth: Date,
    lastActive: Date,
    email: String,
    password: String,
    city: String,
    wish: { age: Number, sex: String },
    status: String,
    requests: [Schema.Types.ObjectId],
    complaint: { type: Number, default: 0 },
    complaintUsers: [Schema.Types.ObjectId],
    like: [Schema.Types.ObjectId],
    avatar: String,
    aboutMe: String,
}, { versionKey: false })

module.exports = model('User', User);