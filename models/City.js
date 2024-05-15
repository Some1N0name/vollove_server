const { Schema, model } = require('mongoose');

const City = new Schema({
    _id: { type: String, unique: true }
})

module.exports = model('City', City);