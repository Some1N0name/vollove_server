const { Schema, model } = require('mongoose');

const City = new Schema({
    name: { type: String, unique: true }
})

module.exports = model('City', City);