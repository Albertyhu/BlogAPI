const mongoose = require('mongoose');
const { DateTime, toLocaleString } = require('luxon');
const Schema = mongoose.Schema;

const Category = new Schema({
    name: {type: String, required: true}, 
    image: { data: Buffer, contentType: String },
    description: { type: String },
    post: [{ type: Schema.Types.ObjectId, ref: "Post" }], 
    dateCreated: { type: Date }, 
    administrator: [{ type: Schema.Types.ObjectId, ref: "User" }], 
})

module.exports = mongoose.model("Category", Category); 