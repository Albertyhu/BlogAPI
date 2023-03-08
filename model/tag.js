const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const Tag = new Schema({
    name: { type: String, required: true },
})


module.exports = mongoose.model("Tag", Tag); 