const mongoose = require('mongoose');
const { DateTime, toLocaleString } = require('luxon');
const Schema = mongoose.Schema;


const Post = new Schema({
    title: { type: String, required: true },
    content: { type: String },
    published: {type: Boolean}, 
    datePublished: { type: Date },
    lastEdited: { type: Date },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    thumbnail: { data: Buffer, contentType: String },
    images: [{ data: Buffer, contentType: String }],
    abstract: { type: String },
    category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    tag: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment"}], 
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }], 
})

Post.virtual("formatted_datePublished").get(function () {
    return this.joinedDate ? DateTime.fromJSDate(this.joinedDate).toLocaleString(DateTime.DATETIME_SHORT) : null;
})

module.exports = mongoose.model("Post", Post);   