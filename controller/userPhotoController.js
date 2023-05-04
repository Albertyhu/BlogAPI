const UserPhoto = require('../model/user_photo.js')
const User = require('../model/user.js');
const { body, validationResult } = require("express-validator");
const he = require('he');
const Comment = require('../model/comment.js'); 
const async = require('async');
const {
    BufferImage,
    BufferArrayOfImages,
} = require("../util/imageHooks.js")

exports.DeletePhoto = [
    body("owner"),
    (req, res, next) => {
        async.parallel([
            function(callback) {
                UserPhoto.deleteOne({ _id: req.params.id })
                    .then((result) => {
                        callback(null)
                    })
                    .catch(error => {
                        console.log("There was a problem deleting the photo: ", error)
                        callback(error)
                    })
            },
            function(callback) {
                User.findByIdAndUpdate(req.body.owner, {
                    $pull: {
                        images: req.params.id, 
                    }
                })
                    .then(() => {
                        callback(null)
                    })
                    .catch(error => {
                        console.log("There was a problem deleting ObjectId from the owner's array: ", error)
                        callback(error)
                    })
            },
            function (callback) {
                Comment.deleteMany({ userPhoto: req.params.id })
                    .then(() => {
                        callback(null)
                    })
                    .catch(error => {
                        console.log("There was a problem deleting the comments and replies: ", error)
                        callback(error)
                    })
            }
        ], (error) => {
            if (error) {
                console.log("DeletePhoto error: ", error)
                res.status(500).json({error})
            }
            res.status(200).json({message: "Photo was deleted."})
        })
    } 
]

exports.UpdatePhoto = [
    body("title")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Your title cannot be empty")
        .escape(),
    body("caption")
        .trim()
        .escape(), 
    async (req, res, next) => {
        var error = validationResult(req); 
        if (!error.isEmpty()) {
            console.log("UpdatePhoto error 1: ", error)
            res.status(400).json({error: error.array()})
        }
        const lastEdited = Date.now(); 
        await UserPhoto.updateOne({ _id: req.params.id }, {
            title: he.decode(req.body.title),
            lastEdited, 
            caption: he.decode(req.body.caption),
        }, { new: true })
            .then(updatedPhoto => {
                console.log("The photo is updated.")
                res.status(200).json({lastEdited})
            })
            .catch(error => {
                console.log("UpdatePhoto error 2: ", error)
                res.status(400).json({ error: [{ param: "server", msg: "Something went wrong with the server." }] })
            })
    }
] 

exports.AddLike = async (req, res, next) => {
    try {
        var userID = req.body.userID; 
        await UserPhoto.updateOne({ _id: req.params.id }, {
            $addToSet: { likes: userID }
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
        var userID = req.body.userID;
        await UserPhoto.updateOne({ _id: req.params.id }, {
            $pull: { likes: userID }
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
    async (req, res, next) => {
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

        if (req.files) {
            obj.images = await BufferArrayOfImages(req.files)
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

//To get the user's photos, it's necessary to retrieve his objectId first
exports.GetUserPhotos = async (req, res, next) => {
    async.waterfall([
        //Get user by name
        function (callback) {
            User.findOne({ username: req.params.id })
                .then(user => {
                    console.log("User has been retrieved")
                    const userId = user._id; 
                    callback(null, userId)
                })
                .catch(error => {
                    console.log("There was a problem with retrieving the user: ", error)
                    callback(error)
                })
        },
        function (userId, callback) {
            UserPhoto.find({ owner: userId })
                .then(userPhotos => {
                    console.log("Photos have been retrieved.")
                    callback(null, userId, userPhotos)
                })
                .catch(error => {
                    console.log("There was a problem with retrieving the user's photos: ", error)
                    callback(error)
                })
        }
    ], (error, userId, userPhotos) => {
        if (error) {
            console.log("GetUserPhotos: ", error)
            return res.status(500).json({ error })
        }
        console.log("GetUserPhotos operation is successful.")
        return res.status(200).json({ photos: userPhotos, userId })
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
    var images = await Promise.all(req.files.map(async img => {
        const date = Date.now();
        const formattedImg = await BufferImage(img); 
        return {
            title: img.originalname,
            image: formattedImg,
            publishedDate: date,
            owner: req.params.id,
        }
    }))
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
         //Delete the photos with the imagesId array
            function (callback) {
                UserPhoto.deleteMany({ _id: imagesId })
                    .then(() => { callback(null)})
                    .catch(error => {
                        console.log("There was an error in deleting the photos: ", error)
                        callback(error)
                    })
            },
            //function to delete the comments as well. 
            function (callback) {
                Comment.deleteMany({ userPhoto: imagesId })
                    .then(() => { callback(null) })
                    .catch(error => {
                        console.log("There was an error in deleting the comments: ", error)
                        callback(error)
                    })
            },
            //Update current User's document
            function (callback) {
                User.updateOne({ _id: req.params.id }, {
                    $pull: {
                        images: { $in: imagesId }
                    }
                }, { new: true })
                    .then(() => { callback(null) })
                    .catch(error => {
                        console.log("There was an error in updating user after deleting photos: ", error)
                        callback(error)
                    })
            },
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

//This controller function retrieves a user's uploaded photos by pagination to support the load-by-scroll feature.
exports.GetUserPhotosByPage = async (req, res, next) => {
    const error = [];
    var COUNT
    var PAGINATION
    try {
        COUNT = parseInt(req.params.count);
        PAGINATION = parseInt(req.params.page)
    } catch (e) {
        error.push(e)
    }
    if (!Number.isInteger(COUNT) || !Number.isInteger(PAGINATION) || COUNT <= 0 || PAGINATION < 0) {
        error.push('Invalid count or pagination value');
    }
    if (error.length > 0) {
        console.log("GetAllPostByNewest error: ", error)
        return res.status(400).json({ error })
    }
    const start = PAGINATION * COUNT;
    async.waterfall([
        //Get user by name
        function (callback) {
            User.findOne({ username: req.params.id })
                .then(user => {
                    console.log("User has been retrieved")
                    const userId = user._id;
                    callback(null, userId)
                })
                .catch(error => {
                    console.log("There was a problem with retrieving the user: ", error)
                    callback(error)
                })
        },
        function (userId, callback) {
            UserPhoto.find({ owner: userId })
                .skip(start)
                .limit(COUNT)
                .then(userPhotos => {
                    console.log("Photos have been retrieved.")
                    callback(null, userId, userPhotos)
                })
                .catch(error => {
                    console.log("There was a problem with retrieving the user's photos: ", error)
                    callback(error)
                })
        }
    ], (error, userId, userPhotos) => {
        if (error) {
            console.log("GGetUserPhotosByPage error: ", error)
            return res.status(500).json({ error })
        }
        console.log("GetUserPhotosByPage operation is successful.")
        return res.status(200).json({ photos: userPhotos, userId })
    })
}