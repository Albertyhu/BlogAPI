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
    images: [{ type: Schema.Types.ObjectId, ref: "UserPhoto" }], 
    communitiesFollowed: [{ type: Schema.Types.ObjectId, ref: "Categories" }],
    //Other users that the current user is connected to. This is similar to the friend feature on Facebook.
    connection: [{ type: Schema.Types.ObjectId, ref: "UserPhoto" }],
    //pendingRequestSent: [{ type: Schema.Types.ObjectId, ref: "ConnectionReqest" }],
    //pendintRequestReceived: [{ type: Schema.Types.ObjectId, ref: "ConnectionReqest" }],
    //notification will be in the form of messages
    notifications: [{
        message: { type: String },
        sender: { type: Schema.Types.ObjectId, ref: "User" }, 
        action: {type: String}, 
    }], 
    message: [{
        message: { type: String },
        sender: { type: Schema.Types.ObjectId, ref: "User" }
    }]
})

User.virtual("formatted_JoinedDate").get(function () {
    return this.joinedDate ? DateTime.fromJSDate(this.joinedDate).toLocaleString(DateTime.DATETIME_SHORT) : null; 
})

module.exports = mongoose.model("User", User); 