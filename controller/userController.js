const User = require('../model/user.js'); 
const dataHooks = require('../util/dataHooks.js'); 
const { body, validationResult } = require("express-validator");
const checkEmail = require('../util/checkEmail.js');
const he = require('he');
const bcrypt = require("bcrypt")
const {  findDuplicateNameAndEmail } = dataHooks(); 
const {
    BufferImage,
} = require("../util/imageHooks.js")
const UserPhoto = require('../model/user_photo.js')
const Category = require("../model/category.js");
const async = require("async"); 
const ConnectionRequest = require('../model/connection_request.js'); 
const jwt = require('jsonwebtoken');

exports.GetAllUsers = async (req, res, next) => {
    try { 
        await User.find({})
            .sort({ username: 1 })
            .exec()
            .then(result => {
                const users = result.map(user => {
                    return {
                        username: user.username,
                        _id: user._id,
                        email: user.email,
                        joinedDate: user.joinedDate,
                        profile_pic: user.profile_pic,
                    }
                })
                return res.status(200).json({ users })
            })
            .catch(error => {
                return res.status(400).json({ error: [{ param: "server", msg: err }] }); 
            })
    } catch (err){
        return res.status(404).json({ error: [{ param: "server", msg: err }] })
    }
}

exports.GetUserSearchData = async (req, res, next) => {
    await User.find({})
        .select("username profile_pic biography email _id")
        .sort({ name: 1 })
        .then(result => {
            const data = result.map(({_id, username, email, biography, profile_pic }) => {
                const collectedStrings = []
                collectedStrings.push(username)
                collectedStrings.push(email)
                collectedStrings.push(biography)
                return {
                    _id,
                    username,
                    email,
                    biography,
                    collectedStrings, 
                    profile_pic, 
                }
            })
            res.status(200).json({ data })
        })
        .catch(error => {
            console.log("GetCommentSearchData error: ", error)
            res.status(400).json({ error })
        })
}

exports.GetUsersByPagination = async (req, res, next) => {
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
    await User.find({})
        .skip(start)
        .limit(COUNT)
        .sort({ username: 1 })
        .then(paginatedResult => {
            const users = paginatedResult.map(user => {
                var data = {
                    username: user.username,
                    _id: user._id,
                    email: user.email,
                    joinedDate: user.joinedDate,
                }
                if (user.profile_pic) {
                    data.profile_pic = user.profile_pic;
                }
                return data;
            })
            return res.status(200).json({ users })
        })
        .catch(error => {
            return res.status(400).json({ error: [{ param: "server", msg: err }] });
        })

}

exports.GetCurrentUserAndCategories = (req, res, next) => {
    async.parallel({
        GetUser(callback) {        
            User.findById(req.params.id)
                .populate({
                    path: "connection", 
                    model: "User",
                    options: {
                        sort: { username: 1 }
                    }
                })
                .populate({
                    path: "notifications.sender"
                })
                .sort({ 'notifications.dateCreated': -1 })
                .populate({
                    path: "message.sender"
                })
                .sort({ 'message.dateCreated': -1 })
                .then(result => {
                    callback(null, result)
                })
                .catch(error => {
                    console.log("There is a problem with retrieving the current user: ", error)
                    callback(error)
                })
        },
        GetCategories(callback) {
            Category.find({})
                .sort({ name: 1 })
                .then((categories) => callback(null, categories))
                .catch((error) => {
                    console.log("There is a problem with retrieving categories: ", error)
                    callback(error)
                })
        }
    }, (error, result) => {
        if (error) {
            res.status(400).json({error: error})
        }
        var user = {
            username: result.GetUser.username,
            email: result.GetUser.email,
            joinedDate: result.GetUser.joinedDate,
            posts: result.GetUser.posts,
            profile_pic: result.GetUser.profile_pic,
            coverPhoto: result.GetUser.coverPhoto,
            biography: result.GetUser.biography,
            SocialMediaLinks: result.GetUser.SocialMediaLinks,
            communitiesFollowed: result.GetUser.communitiesFollowed, 
            connection: result.GetUser.connection, 
            notifications: result.GetUser.notifications, 
            message: result.GetUser.message, 
        }
        const categories = result.GetCategeories;
        res.status(200).json({categories, user})
    })
}

exports.GetUsersAndCategories = (req, res, next) => {
    async.parallel([
        function(callback) {
             User.find({})
                .sort({ username: 1 })
                .then((users) => callback(null, users))
                .catch((error) => {
                    console.log("There is a problem with retrieving users: ", error)
                    return callback(error)
                })
        },
        function(callback) {
             Category.find({})
                .sort({ name: 1 })
                .then((categories) => callback(null, categories))
                .catch((error) => {
                    console.log("There is a problem with retrieving categories: ", error)
                    return callback(error)
                })
        },
    ], (error, results) => {
        
        if (error) {
            console.log("GetUsersAndCategories: ", error)
            return res.status(404).json({ error: [{ param: "server", msg: error }] })    
        }
        const [users, categories] = results 
        const Users = users.map(user => {
                return {
                    username: user.username,
                    email: user.email,
                    joinedDate: user.joinedDate,  
                    posts: user.posts,
                    biography: user.biography,
                    communitiesFollowed: user.communitiesFollowed,
                }
            })

        return res.status(200).json({Users, categories})
    })
}

exports.GetUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({message: "User is not found."})
        }
        return res.status(200).json({
            username: user.username,
            email: user.email,
            joinedDate: user.joinedDate,
            posts: user.posts,
            profile_pic: user.profile_pic ? user.profile_pic : null,
            coverPhoto:  user.coverPhoto ? user.coverPhoto : null,
            biography: user.biography,
            SocialMediaLinks: user.SocialMediaLinks,
            message: `Successfully fetched ${user.username}`,
        })
    } catch (e) {
        return res.status(404).json({ message: `Error in fetching user: ${e}` })

    }
}

exports.GetUserProfilePicture = async (req, res, next) => {
    try {
        await User.findById(req.params.id)
            .then(result => {
                if (!result) {
                    return res.status(404).json({ error: [{param: "User is not found.", msg: "User is not found" }]})
                }
                if (!result.profile_pic) {
                    return res.status(404).json({ error: [{ param: "Profile doesn't exist", msg: "The user's profile picture does not exist." }] })
                }
                return res.status(200).json({message: "Profile picture found", profile_pic: result.profile_pic})
            })
    }
    catch (e) {
        return res.status(500).json({ error: [{ param: "server", msg: "Internal service error: " + e }] })

    }
}

exports.GetUserProfilePictureAndCoverPhoto = async (req, res, next) => {
    try {
        await User.findById(req.params.id)
            .then(result => {
                return res.status(200).json({
                    message: "Profile picture found",
                    profile_pic: result.profile_pic ? result.profile_pic : null,
                    cover_photo: result.coverPhoto ? result.coverPhoto : null, 
                })
            })
            .catch(error => {
                console.log("GetUserProfilePictureAndCoverPhoto error: ", error)
                res.status(500).json({error})
            })
    }
    catch (e) {
        return res.status(500).json({ error: [{ param: "server", msg: "Internal service error: " + e }] })

    }
}

exports.UploadNewProfilePicture = async (req, res, next) => {
    try {
         
        const BufferedImg = await BufferImage(req.file)
        const updates = {
            _id: req.params.id,
            profile_pic: BufferedImg, 
        }
        const updateUser = new User(updates)
        User.findByIdAndUpdate(req.params.id, updateUser)
            .then(() => {
                return res.status(200).json({message: "Profile picture has been successfully updated."})
            })
            .catch(e => {
                return res.status(404).json({ error: [{ param: "server", msg: `Error in updating profile picture: ${e}.` }] })
            })
    } catch (e) {
        console.log("Error in uploading new profile picture: ", e)
        return res.status(500).json({ error: [{para: "server error", msg: `Upload error: ${e}`}]})
    } 
}

exports.GetUsernameAndEmails = async (req, res, next) => {
    try {
        const result = await User.find({})
            .sort({ username: 1 })
            .exec(); 
        var data = []
        result.forEach(person => {
            data.push({
                username: person.username, 
                email: person.email,
            })
        })
        res.status(200).json(data)
    } catch (e) {
        return res.status(404).json({ message: "No users." })
    }
}

exports.UpdateUserProfile = [
    body("username")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Username field cannot be empty.")
        .escape(),
    body("email")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Your email address field cannot be empty.. ")
        .custom((value) => {
            if (!checkEmail(value)) {
                throw new Error("The email format is not valid. It must be something along the lines of Bob@email.com.");
            }
            return true;
        }),
    body("profile_pic"),
    body("biography")
    .escape(),
    body("keepProfilePic"),
    body("keepCoverPhoto"),
    async (req, res) => {
        const {
            username,
            email,
            biography,
            keepProfilePic,
            keepCoverPhoto
        } = req.body
        var errors = validationResult(req);
        const DuplicateErrors = findDuplicateNameAndEmail(req.params.id, req.body.username, req.body.email)
        errors.errors = errors.errors.concat(DuplicateErrors);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        try {
            var newUpdate = {
                username: he.decode(username.replace(/\s/g, '')),
                email: he.decode(email),
                biography: req.body.biography.trim() ? he.decode(req.body.biography) : "",
                _id: req.params.id
            }

            if (typeof req.files.profile_pic != 'undefined' && req.files.profile_pic != null) {
                newUpdate.profile_pic = await BufferImage(req.files.profile_pic[0])
            }

            //If the user clears the profile pic from the input
            if (req.body.keepProfilePic === "false") {
                newUpdate.profile_pic = null;
            }

            //If the user clears the cover photo from the input
            if (typeof req.files.coverPhoto != 'undefined' && req.files.coverPhoto != null) {
                newUpdate.coverPhoto = await BufferImage(req.files.coverPhoto[0])
            }
            if(req.body.keepCoverPhoto === "false") {
                newUpdate.coverPhoto = null;
            }
            await User.findByIdAndUpdate(req.params.id, newUpdate, {new: true})
                .then((result) => {
                    const updatedUser = {
                        username: req.body.username,
                        email: req.body.email,
                        joinedDate: result.joinedDate,
                        id: result._id,
                        "role": "member", 
                    }
                    const token = jwt.sign(updatedUser, process.env.JWT_SECRET, { expiresIn: 60 * 60 })
                    const ProfilePicture = result.profile_pic ? result.profile_pic : null;
                    const coverPhoto = result.coverPhoto ? result.coverPhoto : null;
                    console.log(`${req.body.username}'s profile has successfully been updated.`)
                    return res.status(200).json({
                        user: updatedUser,
                        ProfilePicture,
                        coverPhoto,
                        token, 
                        message: `${req.body.username}'s profile has successfully been updated.`
                    })
                })
                .catch(e => {
                    return res.status(500).json({ error: [{param: "server", msg: `${e}`}]})
                })
        } catch (e) {
            return res.status(404).json({error: [{ param: "server", msg: `${e}` }] })
        }
    }
]

exports.ChangePassword = [
    body('current_password')
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your current password must be at least 4 characters long."),
    body("new_password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long."),
    body("confirm_password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your confirmation password must be at least 4 characters long.")
        .custom((val, { req }) => {
            if (val != req.body.new_password) {
                throw new Error("Your confirmation password must match your new password")
            }
            return true;
        }),
    body("over"),
    async (req, res, next) => {
        const errors = validationResult(req)
        const {
            current_password,
            new_password,
            confirm_password
        } = req.body;
        await User.findById(req.params.id)
        .then(async result => {
            if (!(await bcrypt.compare(req.body.current_password, result.password))) {
                errors.errors.push({ param: "current_password", msg: 'The current password you typed is not correct.' })
            }
            if (await bcrypt.compare(req.body.new_password, result.password)) {
                errors.errors.push({ param: "new_password", msg: 'Your new password must be different from your current password.' })
            }
    

        }).catch(e => {
            return res.status(500).json({ error: [{ param: "server", msg: e }] })
        })

        if (!errors.isEmpty()) {
            console.log("Error 233: ", errors)
            return res.status(404).json({ error: errors.array() })
        }

        try {
            const hashedPassword = await bcrypt.hash(req.body.new_password, 10)
            await User.findByIdAndUpdate(req.params.id, { password: hashedPassword }, {new: true})
                .then(result => {
                    return res.status(200).json({message: "Password has successfully been updated."})
                })
                .catch(e => {
                    console.log("Error 249: ", e)
                    return res.status(500).json({ error: [{param: "server", msg: e}]})
                })
        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            res.status(500).json({ error: [{param: "server", msg:`Error 253: ${e}`}] });
        }
    }
]

exports.DeleteUser = async (req, res, next) => {
    console.log("Deleting user")
    await User.deleteOne({ _id: req.params.id })
        .then(result => {
            console.log("User has successfully been deleted.")
            res.status(200).json({ message: "User has been deleted" });
        })
        .catch(e => {
            console.log("Error in deleting user: ", e)
            res.status(500).json({ message: "Internal service error", error: e.message });
        })

}

exports.DeleteUserWithPassword = [
    body("currentPassword")
        .trim()
        .isLength({ min: 1 })
        .withMessage("The password field cannot be empty.")
        .escape(),
    body("confirmPassword")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You must type your password again.")
        .custom((val, { req }) => {
            if (val != req.body.currentPassword) {
                throw new Error("Your passwords do not match.")
            }
            return true
        }),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log("DeleteUserWithPassword: ", errors.array())
            res.status(404).json({ error: errors.array() })
        }
        console.log("Deleting user")
        await User.deleteOne({ _id: req.params.id })
            .then(result => {
                console.log("User has successfully been deleted.")
                res.status(200).json({ message: "User has been deleted" });
            })
            .catch(e => {
                console.log("Error in deleting user: ", e)
                res.status(500).json({ message: "Internal service error", error: e.message });
            })
    }
]

exports.GetUserByName = async (req, res, next) => {
    User.findOne({ username: req.params.id })
        .populate("connection")
        .populate({
            path: "images",
            model: "UserPhoto",
            select: "image _id lastEdited publishedDate",
            sort: { lastEdited: -1 }, 
            limit: 5, 
        })
        .populate({
            path: "posts",
            model: "Post",
            sort: { lastEdited: -1 },
            limit: 5, 
            select: "title content abstract datePublished lastEdited likes comments mainImage"
        })
        .then(result => {
            if (!result) {
                return res.status(404).json({ message: "User is not found." })
            }
            const user = {
                username: result.username,
                email: result.email,
                joinedDate: result.joinedDate,
                profile_pic: result.profile_pic,
                coverPhoto: result.coverPhoto,
                biography: result.biography,
                SocialMediaLinks: result.SocialMediaLinks,
                connection: result.connection,
                _id: result._id,
                
            }
            res.status(200).json({
                user,
                images: result.images,
                posts: result.posts, 
                message: `Successfully fetched ${result.username}`,
            })
        })
}

exports.SendConnectionRequest = [
    body("senderId")
        .notEmpty()
        .isMongoId(),
    body("message")
        .trim()
        .escape(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("SendConnectionRequest error 1: ", errors.array())
            res.status(400).json({ error: errors.array() })
        }
        const obj = {
            sender: req.body.senderId,
            receiver: req.params.id,
            message: req.body.message ? he.decode(req.body.message) : null,
            dateSent: Date.now(),
        }
        const newRequest = new ConnectionRequest(obj)
        async.waterfall([
            function (callback) {
                newRequest.save()
                    .then(newRequest => {
                        callback(null, newRequest)
                    })
                    .catch(error => {
                        console.log("There was a problem saving the new connection request: ", error)
                        callback(error)
                    })
            },
            function (newRequest, callback) {
                User.findByIdAndUpdate(req.body.senderId, {
                    $addToSet: { connectionRequest: newRequest._id},
                }).then(updatedSender => {
                    if (!updatedSender) {
                        res.status(404).json({ error: [{msg: "Sender is not found", param: "Bad client request"}]})
                    }
                    callback(null, newRequest)
                })
                    .catch(error => {
                        console.log("There was a problem updating the sender document: ", error)
                        callback(error)
                    })
            },
            function (newRequest, callback) {
                const newNotification = {
                    message: newRequest.message, 
                    sender: req.body.senderId,
                    action: "connection_request",
                    dateCreated: Date.now(), 
                }
                User.findByIdAndUpdate(req.params.id, {
                    $push: { connectionRequest: newRequest._id,
                                notifications: newNotification, 
                    }
                })
                    .then(updatedReceiver => {
                        if (!updatedReceiver) {
                            res.status(404).json({ error: [{ msg: "Receiver is not found", param: "Bad client request" }] })
                        }
                        callback(null, newRequest)
                    })
                    .catch(error => {
                        console.log("There was a problem updating the sender document: ", error)
                        callback(error)
                    })
            }
        ], (error, newRequest) => {
            if (error) {
                console.log("SendConnectionRequest  Error: ", error)
                return res.status(500).json({ error })
            }
            return res.status(200).json({})
        })
    
    }
]

exports.HandleConnectionRequest = [
    body("accept"),
    body("senderId"),
    body("receiverId"), 
    (req, res, next) => {
        async.parallel([
            function () {
                ConnectionRequest.deleteOne({ _id: req.params.id })
                    .then(() => callback(null))
                    .catch(error => {
                        console.log("HandleConnectionRequest Error: ", error)
                        callback(error)
                    })
            },
            function () {
                if (req.body.accept) {
                    User.findByIdAndUpdate(req.body.senderId, {
                        $addToSet: { connection: req.body.receiverId },
                    })
                        .then(() => callback(null))
                        .catch(error => {
                            console.log("There was an error addeding the receiver as a connection to the sender: ", error)
                            callback(error)
                        })
                }
            },
            function () {
                if (req.body.accept) {
                    User.findByIdAndUpdate(req.body.receiverId, {
                        $addToSet: { connection: req.body.senderId },
                    })
                        .then(() => callback(null))
                        .catch(error => {
                            console.log("There was an error addeding the sender as a connection to receiver: ", error)
                            callback(error)
                        })
                }
            }
        ], (error) => {
            if (error) {
                console.log("HandleConnectionRequest Error: ", error)
                return res.status(500).json({ error })
            }
            res.status(200).json({})
        })
    }
]

exports.RetrieveConnectionRequests = (req, res, next) => {
    async.parallel({
        GetSent(callback) {
            ConnectionRequest.find({ sender: req.params.id })
                .populate("receiver")
                .then(sent => {
                    callback(null, sent)
                })
                .catch(error => {
                    console.log("There was an error retrieving sent requests: ", error)
                    callback(error)
                })
        },
        GetReceived(callback) {
            ConnectionRequest.find({ receiver: req.params.id })
                .populate("sender")
                .then(received => {
                    callback(null, received)
                })
                .catch(error => {
                    console.log("There was an error retrieving received requests: ", error)
                    callback(error)
                })
        }
    }, (error, result) => {
        if (error) {
            console.log("RetrieveConnectionRequests Error: ", error)
            return res.status(500).json({ error })
        }
        res.status(200).json({sent: result.GetSent, received: result.GetReceived})
    })
}
