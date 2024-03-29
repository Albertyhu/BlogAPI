const mongoose = require('mongoose');
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

    //This refers to the author of the comment or reply that this comment is replying to. 
    userRepliedTo: { type: String },

    //This refers to the main comment being replied to 
    rootComment: {type:Schema.Types.ObjectId, ref: "Comment"},  
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

    //This refers to the post that the comment belongs to 
    post: { type: Schema.Types.ObjectId, ref: "Post" },

    //If the comment is a reply to a user's photo, this field keeps track of the objectId of the photo, the post field should be empty.
    userPhoto: { type: Schema.Types.ObjectId, ref: "UserPhoto" }, 
})

Comment.virtual("formatted_dateCreated").get(function () {
    return this.dateCreated ? DateTime.fromJSDate(this.dateCreated).toLocaleString(DateTime.DATETIME_SHORT) : null;
})

module.exports = mongoose.model("Comment", Comment); 
