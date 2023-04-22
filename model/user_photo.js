const mongoose = require('mongoose'); 
const Schema = mongoose.Schema; 

const UserPhoto = new Schema({
    image: { data: Buffer, contentType: String },
    title: { type: String },
    publishedDate: { type: Date },
    lastEdited: { type: Date },
    caption: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
})

module.exports = mongoose.model("UserPhoto", UserPhoto); 