const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const Tag = new Schema({
    name: { type: String, required: true },
    post: [{ type: Schema.Types.ObjectId, ref: "Post"}],
})


module.exports = mongoose.model("Tag", Tag); 