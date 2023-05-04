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
const UserPhoto = require("../model/user_photo.js"); 
const {
    BufferImage,
    BufferArrayOfImages,
} = require("../util/imageHooks.js"); 

exports.AddCommentToPost = [
    body("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You have to write something to post your comment.")
        .escape(),
    body("author"),
    async (req, res, next) => {
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
        if (typeof req.files != 'undefined' && req.files.length > 0) {
            //images = req.files.map(img => {
            //    return {
            //        data: img.buffer,
            //        contentType: img.mimetype,
            //    }
            //})

            //obj.images = images; 
            obj.images = await BufferArrayOfImages(req.files); 
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
                )
                .then(post => {
                    return callback(null, comment, post)
                })
                .catch(error => callback(error))
            },
            //The purpose of this function is to help the client render the profile picture and username that are to be placed next to the comment after the comment gets posted.
            function (comment, post, callback) {
                User.findOne({_id: req.body.author})
                    .then(author => callback(null, comment, post, author))
                    .catch(error => callback(error))
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

exports.AddCommentToUserPhoto = [
    body("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You have to write something to post your comment.")
        .escape(),
    body("author"),
    async (req, res, next) => {
        var error = validationResult(req);
        if (!error.isEmpty()) {
            console.log("AddComment Error: ", error)
            return res.status(404).json({ error: error.array() })
        }

        var obj = {
            content: he.decode(req.body.content),
            author: req.body.author,
            datePublished: Date.now(),
            userPhoto: req.params.id,
        }

        if (req.files) {
            obj.images = await BufferArrayOfImages(req.files); 
        }
        var newComment = new Comment(obj)
        async.waterfall([
            function (callback) {
                newComment.save()
                    .then(comment => {
                        console.log("Comment is created: ", comment)
                        return callback(null, comment)
                    })
                    .catch(error => {
                        console.log("There was an error with creating the new comment: ", error)
                        return callback(error)
                    })
            },
            function (comment, callback) {
                UserPhoto.findByIdAndUpdate(req.params.id, {
                    $addToSet: { comments: comment._id }
                }, { new: true })
                    .then(updatedPhoto => {
                        console.log("Photo has been updated")
                        return callback(null, comment, updatedPhoto)
                    })
                    .catch(error => {
                        console.log("There was an error with updating the photo: ", error)
                        return callback(error)
                    })
            },
            function (comment, updatedPhoto, callback) { 
                User.findOne({ _id: req.body.author })
                    .then(author => {
                        console.log("Author information has been retrieved")
                        return callback(null, comment, updatedPhoto, author)
                         
                    })
                    .catch(error => callback(error))
            }
        ], (error, comment, updatedPhoto, author) => {
            if (error) {
                console.log("AddComment error: ", error)
                return res.status(400).json({ error: [{ param: 'general', msg: 'Bad client request' }] })
            }
            console.log("Comment has been successfully added to the photo")
            return res.status(200).json({ comment, author })
        })
    }
] 

exports.AddReplyToComment = [
    body("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You have to write something to post your reply.")
        .escape(),
    //This is the ObjectId of the author of the reply
    body("author"),
    //This is the username of the author of the comment being replied to 
    body("userRepliedTo"), 
    body("commentRepliedTo"), 
    body("postId"), 
    body("userPhotoId"), 
    body("root"),
    async (req, res, next) => {
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
            commentRepliedTo: req.body.commentRepliedTo,
            rootComment: req.params.id, 
            post: req.body.postId ? req.body.postId : null, 
            userPhoto: req.body.userPhotoId ? req.body.userPhotoId : null, 
            userRepliedTo: req.body.userRepliedTo, 
        }
        if (typeof req.files != 'undefined' && req.files.length > 0) {
            //images = req.files.map(img => {
            //    return {
            //        data: img.buffer, 
            //        contentType: img.mimetype,
            //    }
            //})
            //obj.images = images;
            obj.images = await BufferArrayOfImages(req.files); 
        }

        //console.log("obj.images: ", obj.images)
        const newComment = new Comment(obj)

        async.waterfall([
            function (callback) {
                newComment.save()
                    .then(reply => {
                        return callback(null, reply)
                    })
                    .catch(error => {
                        console.log("There is an error with saving the reply as a comment: ", error)
                        return callback(error)
                    })
            },
            function (reply, callback) {
                Comment.findByIdAndUpdate(req.params.id, {
                    $addToSet: { replies: reply._id }
                },
                    { new: true }
                ).then(comment => {
                    return callback(null, reply, comment)
                })
                    .catch(error => {
                        console.log("There is an error with saving the reply ObjectId into the parent comment: ", error)
                        return callback(error)
                    })
            },
            function (reply, comment, callback) {
                User.findOne({ _id: req.body.author })
                    .then(author => callback(null, reply, comment, author))
                    .catch(error => {
                        console.log("There is an error with returning the author: ", error)
                        return callback(error)
                    })
            }
        ], (err, reply, comment, author) => {
            if (err) {
                 console.log("AddCommentToPost error: ", err)
                return res.status(400).json({ error: [{ param: 'general', msg: 'Bad client request' }] })
            }
            console.log("Reply has been successfully added.")
            return res.status(200).json({ comment: reply, author })
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
                console.log(`RemoveLikes error`, e)
            })
    } catch (e) {
        console.log(`AddToLikes error`, e)
    }
}


exports.EditComment = [
    body("authorId"), 
    body("userId")
        .custom((val, { req }) => {
            if (val != req.body.authorId) {
                throw new Error("You are not the author of the comment")
            }
            return true; 
        }),
    body("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Your comment cannot be empty")
        .escape(),
    async (req, res, next) => {
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ error: error.array() })
        }
        const obj = {
            content: he.decode(req.body.content),
            lastEdited: Date.now(),
        }
        var keepImages = [];

        var newImages = []; 
        if (typeof req.files != 'undefined') {
            newImages = await BufferArrayOfImages(req.files); 
        }
        try {
            async.waterfall([
                function (callback) {
                    Comment.findByIdAndUpdate(req.params.id, obj, { new: true })
                        .then(comment => {
                            console.log("The content of comment was successfully updated")
                            return callback(null, comment)
                        })
                        .catch(error => {
                            console.log("There is an error with updating content of the comment: ", error)
                            return callback(error)
                        })
                },
                function (comment, callback) {
                    var ToDelete = comment.images.filter(img => !keepImages.some(existing => existing._id.toString() == img._id.toString()));
                    var ToDeleteId = ToDelete.map(val => val._id);
                    Comment.updateOne({ _id: req.params.id }, {
                        $pull: {
                            images: {
                                _id: { $in: ToDeleteId }
                            }
                        }
                    }, { new: true })
                        .then(result => {
                            console.log("Any images to be deleted are removed.")
                            return callback(null, comment, result)
                        })
                        .catch(error => {
                            console.log("There is an error with removing images: ", error)
                            return callback(error)
                        })
                },
                function (comment, result, callback) {
                    Comment.updateOne({ _id: req.params.id }, {
                        $addToSet: {
                            images: { $each: newImages }
                        }
                    }, { new: true })
                        .then(result => {
                            console.log("Any new images uploaded are added")
                            return callback(null, comment, result)
                        })
                        .catch(error => {
                            console.log("There is an error with adding images: ", error)
                            return callback(error)
                        })
                },
                function (comment, result, callback) {
                    Comment.findOne({ _id: req.params.id })
                        .populate(
                            {
                            path: 'author',
                            model: "User",
                        })
                        .populate(
                                {
                                path: 'replies',
                                model: "Comment",
                                populate: ({
                                    path: "author",
                                    model: "User", 
                                }
                           ) 
                        })
                        .then(updatedComment => {
                            console.log("Updated comment retrieved")
                            return callback(null, comment, result, updatedComment)
                        })
                        .catch(error => {
                            console.log("There was an error with trying to retrieve updated comment: ", error)
                            return callback(error)
                        })
                },
            ], (error, comment, result, updatedComment) => {
                if (error) {
                    console.log("EditComment Error 1: ", error)
                    return res.status(400).json({ error: [{param: "general", msg: error}]})
                }
                console.log("Comment has been updated: ")
                return res.status(200).json({comment: updatedComment})
            })
        } catch (e) {
             console.log("EditComment error 2: ", e)
            return res.status(500).json({ error: [{ param: 'server', msg: 'Internal server error' }] })
        }
    }
]

//This deletes the comment and all it's replies
exports.DeleteCompletely = [
    body("rootId"),
    body("rootType"), 
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("DeleteCompletely error: ", errors.array())
            return res.status(500).json({ error: errors.array() })
        }
        try {
            const rootId = req.body.rootId;
            const rootType = req.body.rootType;
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
                    if (typeof comment.post != 'undefined' && comment.post != null && comment.post != "") {
                        Post.findByIdandUpdate(comment.post, {
                            $pull: { comments: req.params.id }
                        })
                            .then(() => {
                                console.log("Removed comment ObjectId from Post")
                                callback(null, comment)
                            })
                            .catch(error => {
                                callback(error)
                            })
                    }
                    else if (typeof comment.userPhoto != 'undefined' && comment.userPhoto != null && comment.userPhoto != "") {
                        UserPhoto.findByIdAndUpdate(comment.userPhoto, {
                            $pull: { comments: req.params.id }
                        })
                            .then(() => {
                                console.log("Removed comment ObjectId from user's photo")
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
                            $pull: { replies: req.params.id }
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
                    return res.status(500).json({ error: [{ param: "server", msg: "Internal Server Error" }] })
                }
                console.log("Comment has been completely deleted.")
                return res.status(200).json({ message: [{ param: "general", msg: "Your comment is successfully deleted." }] })
            })
        }
        catch (e) {
            console.log("DeleteCompletely error: ", e)
        }
    }
]

    
