const mongoose = require('mongoose');
const { DateTime, toLocaleString } = require('luxon');
const Schema = mongoose.Schema;


const Comment = new Schema({
    content: { type: String },
    datePublished: { type: Date },
    lastEdited: { type: Date },
    images: [{ data: Buffer, contentType: String }],
    author: { type: Schema.Types.ObjectId, ref: "User" }, 

    //This refers to number of replies the comment has 
    replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }],

    //This refers to the comment or reply that that this comment is replying to. 
    commentRepliedTo: { type: Schema.Types.ObjectId, ref: "Comment" }, 

    //This refers to the author of the comment or reply that this comment is replying tot. 
    userRepliedTo: { type: String },

    //This refers to the main comment being replied to 
    rootComment: {type:Schema.Types.ObjectId, ref: "Comment"},
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

    //This refers to the post that the comment belongs to 
    post: {type: Schema.Types.ObjectId, ref: "Post" },
})

Comment.virtual("formatted_dateCreated").get(function () {
    return this.dateCreated ? DateTime.fromJSDate(this.dateCreated).toLocaleString(DateTime.DATETIME_SHORT) : null;
})

module.exports = mongoose.model("Comment", Comment); 
