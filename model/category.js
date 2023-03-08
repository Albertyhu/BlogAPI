const mongoose = require('mongoose');
const { DateTime, toLocaleString } = require('luxon');
const Schema = mongoose.Schema;

const Category = new Schema({
    name: {type: String, required: true}, 
    image: { data: Buffer, contentType: String },
    description: { type: String },
    tag: [{ type: Schema.Types.ObjectId, ref: "Tag" }]
})

module.exports = mongoose.model("Category", Category); 