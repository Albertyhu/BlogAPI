const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectionRequest = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String },
    dateSent: { type: Date },
})

module.exports = mongoose.model("ConectionRequest", ConnectionRequest)