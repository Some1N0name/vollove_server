const { Schema, model } = require('mongoose');

const Admin = new Schema({
    login: String,
    password: String,
}, { versionKey: false })

module.exports = model('Admin', Admin);