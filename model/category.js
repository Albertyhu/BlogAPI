const mongoose = require('mongoose');
const { DateTime, toLocaleString } = require('luxon');
const Schema = mongoose.Schema;


const Category = new Schema({
    name: {type: String, required: true}, 
    image: { data: Buffer, contentType: String },
    description: { type: String },
    tag: [{ type: String }]
})

Category.virtual("formatted_JoinedDate").get(function () {
    return this.joinedDate ? DateTime.fromJSDate(this.joinedDate).toLocaleString(DateTime.DATETIME_SHORT) : null;
})

module.exports = mongoose.model("Category", Category); 