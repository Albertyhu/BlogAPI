const Post = require('../model/post.js');
const User = require('../model/user.js');
const Comment = require("../model/comment.js");
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator')
const { CheckLength } = require('../util/tinyMCEHooks.js');
const he = require('he');
const { retrieveTagId } = require('./tagController.js');
const { genKey } = require('../util/randGen.js');
const async = require('async');
const fs = require('fs')
const path = require("path")

exports.AddCommentToPost = [
    body("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You have to write to post your comment.")
        .escape(),
    body("author"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ error: errors.array() })
        }
        var images = []; 
        var date = Date.now(); 
        const obj = {
            content: he.decode(req.body.content),
            datePublished: date, 
            lastEdited: date, 
            author: req.body.author,
            post: req.params.id, 
        }
        console.log("req.files: ", req.files)
        if (typeof req.files != 'undefined' && req.files.length > 0) {
            images = req.files.map(img => {
                return {
                    data: fs.readFileSync(path.join(__dirname, "../public/uploads/", img.filename)),
                    contentType: img.mimetype,
                }
            })
            obj.images = images; 
        }

        //console.log("obj.images: ", obj.images)
        const newComment = new Comment(obj)

        async.waterfall([
            function (callback) {
                newComment.save()
                    .then(comment => {
                        return callback(null, comment)
                    })
                    .catch(error => {return callback(error) })
            },
            function (comment, callback) {
                Post.findByIdAndUpdate(req.params.id, {
                    $addToSet: { comments: comment._id }
                },
                    { new: true }
                ).then(post => {
                    return callback(null, comment, post)
                })
                //.catch(error => callback(error))
            },
            function (comment, post, callback) {
                User.findOne({_id: req.body.author})
                    .then(author => callback(null, comment, post, author))
                    //.catch(error => callback(error))
            }
        ], (err, comment, post, author) => {
            if (err) { 
               // console.log("AddCommentToPost error: ", err)
                return res.status(500).json({ error: [{param: 'server', msg: 'Something when wrong with the server'}]})
            }
            console.log("Comment has been successfully added.")
            res.status(200).json({comment, author})
        })
    }
] 

exports.UpdateLikes = async (req, res, next) => {
    if (req.body.updatedLikes) {
        await Comment.findByIdAndUpdate(req.params.id, { likes: JSON.parse(req.body.updatedLikes) }, { new: true })
            .then(result => {
                console.log("result: ", result)
            })
            .catch(e => {
                console.log(`There is an error in updating likes on ${req.params.id}`, e)
            })
    } else {
        console.log(`There is a problem with the likes array passed from client`)
    }
}

exports.AddToLikes = async (req, res) => {
    try {
        const userID = req.body.userID;
        await Comment.findByIdAndUpdate(req.params.id, {
            $addToSet: {
                likes: userID,
            }
        })
            .then(result => {
                console.log("result: ", result)
            })
            .catch(e => {
                console.log(`AddToLikes error`, e)
            })
    } catch (e) {
        console.log(`AddToLikes error`, e)
    }
}

exports.RemoveLikes = async (req, res) => {
    try {
        const userID = req.body.userID;
        await Comment.findByIdAndUpdate(req.params.id, {
            $pull: {
                likes: userID,
            }
        })
            .then(result => {
                console.log("result: ", result)
            })
            .catch(e => {
                console.log(`AddToLikes error`, e)
            })
    } catch (e) {
        console.log(`AddToLikes error`, e)
    }
}


exports.EditComment = async (req, res, next) => {
    
}

//This deletes the comment and all it's replies
exports.DeleteCompletely = (req, res, next) => {
    try {
        async.waterfall([
        //delete the Comment document
            function (callback) {
                Comment.deleteOne({ _id: req.params.id })
                    .then(comment => {
                        console.log("Document comment has been deleted: ", comment)
                        callback(null, comment)
                    })
                    .catch(error => {
                        callback(error) 
                    })
            },
            //delete the replies of the comment 
            function (comment, callback) {
                Comment.deleteMany({ commentRepliedTo: req.params.id })
                    .then(replies => {
                        console.log("Attempted to delete all replies of the comment")
                        callback(null, comment)
                    })
                    .catch(error => {
                        callback(error)
                    })
            },
            //remove comment ID from post
            function (comment, callback) {
                if (comment.post) {
                    Post.findByIdandUpdate(comment.post, {
                        $pull: {comments: req.params.id } 
                    })
                        .then(() => {
                            console.log("Removed comment ObjectId from Post")
                            callback(null, comment) 
                        })
                        .catch(error => {
                            callback(error) 
                        })
                }
                else
                    callback(null, comment)
            },
            function (comment, callback) {
                if (comment.commentRepliedTo) {
                    Comment.findByIdAndUpdate(comment.commentRepliedTo, {
                        $pull: {replies: req.params.id}
                    })
                        .then(() => {
                            console.log("Removed comment Object Id from comment being replied to.")
                            callback(null, comment)
                        })
                    .catch(error => callback(error))
                }
                else
                   callback(null, comment)
            }
        ], (error, comment) => {
            if (error) {
                console.log("DeleteCompletely error: ", error)
                return res.status(500).json({ error: [{param: "server", msg: "Internal Server Error"}]})
            }
            console.log("Comment has been completely deleted.")
            return res.status(200).json({ message: [{param: "general", msg: "The comment and all its replies have been deleted."}]})
        })
    } catch (e) {
        console.log("DeleteCompletely error: ", e)
    }
}