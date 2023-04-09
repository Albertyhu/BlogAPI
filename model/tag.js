const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//the Tag document keeps track of post so that the client can display how popular the tag is. 
const Tag = new Schema({
    name: { type: String, required: true, unique: true },
    post: [{type: Schema.Types.ObjectId, ref: "Post"}],
})


module.exports = mongoose.model("Tag", Tag); 