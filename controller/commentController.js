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
        if (typeof req.files != 'undefined' && req.files.images.length > 0) {
            images = req.files.images.map(img => {
                return {
                    buffer: fs.readFileSync(path.join(__dirname, "../public/uploads/", file.filename)),
                    contentType: img.memeType,
                }
            })
            obj.images = images; 
        }
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
            }
        ], (err, comment, post) => {
            if (err) { 
                console.log("AddCommentToPost error: ", err)
                return res.status(500).json({ error: [{param: 'server', msg: 'Something when wrong with the server'}]})
            }
            res.status(200).json({comment})
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