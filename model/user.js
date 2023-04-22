const mongoose = require('mongoose'); 
const { DateTime, toLocaleString } = require('luxon'); 
const Schema = mongoose.Schema; 


const User = new Schema({
    username: { type: String, require: true },
    email: { type: String, require: true },
    password: { type: String, require: true }, 
    joinedDate: { type: Date }, 
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }], 
    profile_pic: { data: Buffer, contentType: String },
    biography: { type: String },
    SocialMediaLinks: [{
        platform: { type: String },
        link: { type: String }
    }],
    images: [{ data: Buffer, contentType: String }], 
    communitiesFollowed: [{ type: Schema.Types.ObjectId, ref: "Categories" }]
})

User.virtual("formatted_JoinedDate").get(function () {
    return this.joinedDate ? DateTime.fromJSDate(this.joinedDate).toLocaleString(DateTime.DATETIME_SHORT) : null; 
})

module.exports = mongoose.model("User", User); 