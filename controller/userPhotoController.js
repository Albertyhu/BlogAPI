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
const async = require('async');

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
        if (!error.isEmpty()) {
            console.log("UpdatePhoto error: ", error)
            res.status(400).json({error: error.array()})
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
    body("content")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You have to write something to post your comment.")
        .escape(),  
    body("author"), 
    (req, res, next) => {
        var error = validationResult(req); 
        if (!error.isEmpty()) {
            console.log("AddComment Error: ", error)
            return res.status(404).json({ error: error.array() })
        }
        console.log("req.body: ", req.body)
        var obj = {
            content: he.decode(req.body.content), 
            author: req.body.author,
            datePublished: Date.now(), 
            userPhoto: req.params.id, 
        } 
        console.log("req.files: ", req.files)
        if (req.files) {
            var images = req.files.map(img => {
                return {
                    data: img.buffer, 
                    contentType: img.mimetype,
                }
            })
            obj.images = images; 
        }
        var newDoc = new Comment(obj)
        async.waterfall([
            function (callback) {
                newDoc.save()
                    .then(newComment => {
                        console.log("Comment is created: ", newComment)
                        return callback(null, newComment)
                    })
                    .catch(error => {
                        console.log("There was an error with creating the new comment: ", error)
                        return callback(error)
                    })
            },
            function (newComment, callback) {
                UserPhoto.findByIdAndUpdate(req.params.id, {
                    $addToSet: {comments: newComment._id}
                }, { new: true })
                    .then(updatedPhoto => {
                        console.log("Photo has been updated")
                        return(null, newComment, updatedPhoto)
                    })
                    .catch(error => {
                        console.log("There was an error with updating the photo: ", error)
                        return callback(error)
                    })
            },
            function (newComment, updatedPhoto, callback) {
                User.findOne({ _id: req.body.author })
                    .then(author => {
                        console.log("Author information has been retrieved")
                        return callback(null, newComment, updatedPhoto, author)
                    })
                    .catch(error => callback(error))
            }
        ], (error, newComment, updatedPhoto, author) => {
            if (error) {
                console.log("AddComment error: ", error)
                return res.status(400).json({ error: [{ param: 'general', msg: 'Bad client request' }] })
            }
            console.log("Comment has been successfully added to the photo")
            return res.status(200).json({newComment, updatedPhoto, author})
        })
    }
] 

exports.GetUserPhotos = async (req, res, next) => {
    await UserPhoto.find({ owner: req.params.id })
        .then(photos => {
            console.log("User's photos are retrieved.")
            return res.status(200).json({photos})
        })
        .catch(error => {
            console.log("GetUserPhotos: ", error)
            return res.status(500).json({error})
        })
}

exports.GetOnePhoto = async (req, res, next) => {
    await UserPhoto.findById(req.params.id)
        .populate({
            path: "owner",
            model: "User",
        })
        .populate({
            path: "comments",
            model: "Comment", 
            populate: [
                {
                path: "author",
                model: "User"
                },
                {
                    path: "replies",
                    model: "Comment",
                    populate: {
                        path: 'author',
                        model: 'User',
                    }
                }, 
            ],
        })
        .then(photo => {
            console.log("Photo is successfully retrieved")
            res.status(200).json({photo})
        })
        .catch(error => {
            console.log("GetOnePhoto : ", error)
            return res.status(500).json({ error })
        })
}

exports.UploadPhotos = async (req, res, next) => {
    var images = req.files.map(img => {
        const date = Date.now();
        return {
            title: img.originalname,
            image: {
                data: img.buffer,
                contentType: img.mimetype,
            },
            publishedDate: date,
            owner: req.params.id,
        }
    })
    console.log("images: ", images)
    try {
        async.waterfall([
            function (callback) {
                UserPhoto.insertMany(images)
                    .then(savedImages => {
                        console.log("Images are saved into the database")
                        return callback(null, savedImages)
                    })
                    .catch(error => {
                        console.log("There was an error creating the images: ", error)
                        return callback(error)
                    })
            },
            function (savedImages, callback) {
                const imagesId = savedImages.map(img => img._id)
                User.updateOne({ _id: req.params.id }, {
                    $addToSet: {
                        images: { $each: imagesId }
                    }
                }, { new: true })
                    .then(user => {
                        console.log("User is updated.")
                        return callback(null, savedImages, user)
                    })
                    .catch(error => {
                        console.log("There was an error updating the user: ", error)
                        return callback(error)
                    })
            },
        ], (error, savedImages, user) => {
            if (error) {
                console.log("UploadPhotos error: ", error);
                return res.status(400).json({ error: [{ param: "general", msg: error }] })
            }
            console.log("Successfully uploaded photos")
            return res.status(200).json({ savedImages, user })
        })
    } catch (error) {
        console.log("UploadPhotos error: ", error)
        return next(error)
    }
}

//This function retrieves an array of ObjectId's of the user's photos and delete the photos from the database
//The user also gets updated 
exports.DeleteManyPhotos = [
    body("images")
        .notEmpty()
        .withMessage("You haven't selected any photos yet."),
    (req, res, next) => {
        var error = validationResult(req)
        if (!error.isEmpty()) {
            console.log("DeleteManyPhotos error: ", error)
            res.status(400).json({ error: error.array() })
        }
        var imagesId = imagesId = JSON.parse(req.body.images)
        async.parallel([
            function (callback) {
                UserPhoto.deleteMany({ _id: imagesId })
                    .then(() => { callback(null)})
                    .catch(error => {
                        console.log("There was an error in deleting the photos: ", error)
                        return callback(error)
                    })
            },
            function (callback) {
                User.updateOne({ _id: req.params.id }, {
                    $pull: {
                        images: { $in: imagesId }
                    }
                }, { new: true })
                    .then(() => { callback(null) })
                    .catch(error => {
                        console.log("There was an error in updating user after deleting photos: ", error)
                        return callback(error)
                    })
            }
        ], (error, results) => {
            if (error) {
                console.log("DeleteManyPhotos error: ", error);
                res.status(400).json({ error: [{ param: "general", msg: error }] })
            }
            console.log("Successfully deleted photos")
            res.status(200).json({ results }) 
        })
    }
]
