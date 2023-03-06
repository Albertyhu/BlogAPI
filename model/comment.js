const mongoose = require('mongoose');
const { DateTime, toLocaleString } = require('luxon');
const Schema = mongoose.Schema;


const Comment = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    dateCreated: { type: Date },
    images: [{ data: Buffer, contentType: String }],
    author: {type: Schema.Types.ObjectId, ref: "User", required: true}, 
})

Comment.virtual("formatted_dateCreated").get(function () {
    return this.dateCreated ? DateTime.fromJSDate(this.dateCreated).toLocaleString(DateTime.DATETIME_SHORT) : null;
})

module.exports = mongoose.model("Comment", Comment); 