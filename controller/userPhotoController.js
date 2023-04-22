const UserPhoto = require('../model/user_photo.js')
const User = require('../model/user.js');
const SampleUsers = require('../sampleData/sampleUsers.js');
const dataHooks = require('../util/dataHooks.js');
const { body, validationResult } = require("express-validator");
const checkEmail = require('../util/checkEmail.js');
const he = require('he');
const bcrypt = require("bcrypt")
const { BufferImage, findDuplicateNameAndEmail } = dataHooks(); 
const Comment = require('../model/comment.js'); 

exports.DeletePhoto = async (req, res, next) => {
    await UserPhoto.deleteOne({ _id: req.params.id })
        .then(result => {
            res.status(200).json({message: "The photo has been deleted."})
        })
        .catch(error => {
            console.log("DeletePhoto error: ", error)
            res.status(400).json({ error: [{msg: error, param: "general"}] })
        })
} 

exports.UpdatePhoto = [
    body("title"), 
    body("caption"), 
    async (req, res, next) => {
        var error = validationResult(req); 
        if (error) {
            console.log("UpdatePhoto error: ", error)
            res.status(400).json({error: error.errors.array()})
        }
        await UserPhoto.updateOne({ _id: req.params.id }, {
            title: he.decode(req.body.title),
            lastEdited: Date.now(), 
            caption: he.decode(req.body.caption),
        }, { new: true })
            .then(updatedPhoto => {
                console.log("The photo is updated.")
                res.status(200).json({updatedPhoto})
            })
            .catch(error => {
                console.log("UpdatePhoto error: ", error)
                res.status(400).json({error})
            })
    }
] 

exports.AddLike = async (req, res, next) => {
    try {
        var userId = req.body.userId; 
        await UserPhoto.updateOne({ _id: req.params.id }, {
            $addToSet: {likes: userId}
        })
            .then(result => {
                console.log("like is added: ", result)
            })
            .catch(e => {
                console.log(`AddToLikes error`, e)
                res.status(500).json({param: "general", msg: e})
            })
    } catch (e) {
        console.log(`AddToLikes error`, e)
        res.status(500).json({ param: "general", msg: e })
    }
}

exports.RemoveLike = async (req, res, next) => {
    try {
        var userId = req.body.userId;
        await UserPhoto.updateOne({ _id: req.params.id }, {
            $pull: { likes: userId }
        })
            .then(result => {
                console.log("Like is removed: ", result)
            })
            .catch(e => {
                console.log(`RemoveLikes error`, e)
                res.status(500).json({ param: "general", msg: e })
            })
    } catch (e) {
        console.log(`RemoveLikes error`, e)
        res.status(500).json({ param: "general", msg: e })
    }
}

exports.AddComment = [
    body("content"), 
    body("author"), 
    (req, res, next) => {
        var error = validationResult(req); 
        if (error) {
            console.log("AddComment Error: ", error)
            return res.status(404).json({ error: error.errors.array() })
        }
        var obj = {
            comment: he.decode(req.body.comment), 
            author: req.body.author,
            datePublished: Date.now(), 
        } 
        if (req.files) {
            var images = req.files.map(img => {
                return {
                    data: img.buffer, 
                    contentType: img.mimetype,
                }
            })
            obj.images = images; 
        }
        async.waterfall([
            function (callback) {
                var newDoc = new Comment(obj)
                newDoc.save()
                    .then(newComment => {
                        console.log("Comment is created")
                        return callback(null, newComment)
                    })
                    .catch(error => {
                        console.log("There was an error with creating the new comment: ", error)
                        return callback(error)
                    })
            },
            function (newComment, callback) {
                UserPhoto.updateOne({ _id: req.params.id }, {
                    $addToSet: {comments: newComment._id}
                }, { new: true })
                    .then(updatedPhoto => {
                        console.log("Photo has been updated.")
                        return(null, newComment, updatedPhoto)
                    })
                    .catch(error => {
                        console.log("There was an error with updating the photo: ", error)
                        return callback(error)
                    })
            }
        ], (error, newComment, updatedPhoto) => {
            if (error) {
                console.log("AddComment error: ", error)
                return res.status(400).json({ error: [{ param: 'general', msg: 'Bad client request' }] })
            }
            console.log("Comment has been successfully added to the photo")
            return res.status(200).json({newComment, updatedPhoto})
        })
    }
] 