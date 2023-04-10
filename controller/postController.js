const Post = require('../model/post.js'); 
const User = require('../model/user.js');
const Comment = require("../model/comment.js"); 
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator')
const { CheckLength } = require('../util/tinyMCEHooks.js'); 
const he = require('he'); 
const { retrieveTagId } = require('./tagController.js'); 
const Tag = require("../model/tag.js"); 
const { genKey } = require('../util/randGen.js');
const TagController = require('./tagController.js'); 
const async = require('async');

exports.AllPosts = async (req, res, next) => {
    try {
        var result = await AllPosts.find({})
            .sort({ datePublished: -1 })
            .populate("author")
            .populate("category")
            .exec() 
        if (result) {
            res.status(200).json(result);
        }
        else {
            res.status(404).json({message: "No posts yet"})
        }
    } catch (e) {
        res.status(500).json({ message: "Internal server error." })
    }
}

exports.FindOnePost = async (req, res, next) => {
    try {
        const PostId = req.params.id; 
        const result = await Post.findById(PostId)
            .populate('author')
            .populate("comments")
            .populate("tag")
            .populate("likes")
            .exec()
        if (!result) {
            return res.status(404).json({ error: [{param: 'post', msg: "Post is not found." }]})
        }
        res.status(200).json({ payload: result }); 
    } catch (e) {
        console.log("Internal server error - FindOnePost:", e) 
    }
}

exports.AllPostsByAuthor = async (req, res, next) => {
    try {
        const AuthorID = req.params.authorId; 
        const result = Post.find({ where: { author: AuthorID } })
            .sort({ datePublished: -1 })
            .populate("category")
            .exec();
        res.status(200).json(result); 
    } catch (e) {
        res.status(404).json({ message: "No posts yet." })
    }
}

exports.GetOnePostByAuthor = async (req, res, next) => {
    try {
        const PostID = req.params.postId;
        const AuthorID = req.params.authorId;
        const result = Post.findOne({ where: { _id: PostID, author: AuthorID } })
            .populate("author")
            .populate("category")
            .populate("comments")
            .exec();
        if (result) {
            res.status(200).json(result);
        }
        else {
            res.status(404).json({message: "Post not found."});
        }
    } catch (e) {
        res.status(500).json({ message: "Internal server error." })
    }
}

exports.GetPostsByCategory = async (req, res, next) => {
    try {
     //   await Post.find({ category: { $elemMatch: { $eq: new ObjectId(req.params.categoryID) } } })
        await Post.find({ category: req.params.categoryID })
            .populate("author")
            .populate("tag")
            .then(result => {
                res.status(200).json({post: result})
            }).catch(e => {
                console.log("There was an error retrieving posts by category: ", e)
                res.status(500).json({ error: [{param: "server", msg: `Internal server error.`}]})
            })
    } catch (e) {
        console.log("There was an error retrieving posts by category: ", e);
        res.status(500).json({ error: [{ param: "server", msg: `Internal server error.` }] })
    }
}
 
exports.DeletePostById = async (req, res, next) => {
    const PostId = req.params.id;
    try {
        await Post.deleteOne({ _id: PostId })
            .then(result => {
                console.log("The post has been deleted.")
                return res.status(200).json({ message: "Post has been deleted." })
            })
            .catch(e => {
                return res.status(400).json({ error: [{ param: "general", msg: `Internal server error: ${e}`}] })
            })
    } catch (e) {
        res.status(500).json({ error: [{param: "server", msg: `Internal server error: ${e}`}]})
    }


}

exports.HandleLikeToggle = async (req, res, next) => {
    try {
        const UserId = req.pasams.userId; 
        const PostId = req.params.postId;
        const result = await Post.findOne({ where: { _id: PostId} })
            .exec();
        if (!result) {
            return res.status(404).json({ message: "Post not found." });
        }
        var updatedLikes = []; 
        if (result.likes.some(val => val._id.toString() == UserId.toString())) {
            updatedLikes = result.likes.filter(val => val._id.toString() != UserId.toString())

        }
        else {
            updatedLikes = result.likes; 
            updatedLikes.push(UserId); 

        }
        var obj = {
            _id: result._id,
            likes: updatedLikes,
        }
        var updatedPost = new Post(obj);
        await Post.findByIdAndUpdate(PostId, updatedPost)
        res.status(200).json(updatedLikes)

    } catch (e) {
        res.status(500).json({ message: "Internal server error." })
    }
}

//needs to be tested 
exports.UpdateLikes = async (req, res, next) => {
    if (req.body.updatedLikes) {
        const newUpdate = new Post({
            likes: JSON.parse(req.body.updatedLikes),
        })
        console.log("newUpdate: ", newUpdate)
        await Post.findByIdAndUpdate(req.params.id, { likes: JSON.parse(req.body.updatedLikes) } , {new: true})
            .then(result => {
                console.log("Update is successful")
                console.log("result: ", result)
            })
            .catch(e => {
                console.log(`There is an error in updating likes on ${req.params.id}`, e)
            })
    } else {
        console.log(`There is a problem with the likes array passed from client`)
    }
}

exports.CreatePost = [
    body("title")
        .trim()
        .isLength({ min: 1 })
        .withMessage("The title field must not be empty")
        .escape(),
    body("content")
        .trim()
        .escape(),
    body("abstract")
        .escape(),
    body("published"),
    body("author"),
    body("category"),
    body("tag"),
    body("abstract_char_limit"),
    async (req, res) => {
        if (req.error) {
            return res.status(req.error.statusCode).json({error: req.error.data})
        }

        var errors = validationResult(req);

        const { 
            title, 
            category,
            published,
            abstract,
            abstract_char_limit,
            tag,
            author,
        } = req.body; 

        var thumbnail = null; 
        var images = null; 

        //may cause logical errors 
        if (CheckLength(abstract) > abstract_char_limit) {
            var lengthError = {
                param: "abstract",
                msg: `Your abstract cannot be longer than ${abstract_char_limit} characters.`
            }
            errors.errors = [...errors.errors, lengthError]; 
        }

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        var obj = {
            title: he.decode(title),
            category,
            published,
            abstract: he.decode(abstract),
            author,
            datePublished: Date.now(),
            tag: JSON.parse(tag),
        }
        if (typeof req.files != 'undefined' && req.files.thumbnail != null) {
            thumbnail = {
                data:  req.files.thumbnail[0].buffer,
                contentType: req.files.thumbnail[0].mimetype,
            }
            obj.thumbnail = thumbnail; 
        }
        if (typeof req.files != 'undefined' && req.files.images != null) {
            images = req.files.images.map(file => {
                return {
                    data: file.buffer,
                    contentType: file.memetype
                }
            })
            obj.images = images; 
        }
        try {
            const newPost = new Post(obj)
            await newPost.save()
                .then(result => {
                    console.log("The post has successfully been created: ", result)
                    res.status(200).json({message: "The post has successfully been saved.", post: result})
                })
                .catch(e => {
                    console.log("Error in trying to create a new post 252: ", e)
                    res.status(500).json({ error: [{param: "server", msg:"Something went wrong when trying to create a post."}]})
                })
        } catch (e) {
            console.log("Error in trying to create new post: ", e.message)
            return res.status(404).json({ error: [{ param: "server", msg: `${e}` }] })
        }
    }
]

exports.CreatePostAndUpdateTags = [
    body("title")
        .trim()
        .isLength({ min: 1 })
        .withMessage("The title field must not be empty")
        .escape(),
    body("content")
        .trim()
        .escape(),
    body("abstract")
        .escape(),
    body("published"),
    body("author"),
    body("category"),
    body("tag"),
    body("abstract_char_limit"),
    async (req, res, next) => {
        if (req.error) {
            return res.status(req.error.statusCode).json({ error: req.error.data })
        }

        var errors = validationResult(req);

        const {
            title,
            category,
            published,
            abstract,
            abstract_char_limit,
            tag,
            author,
        } = req.body;

        var thumbnail = null;
        var images = null;

        //may cause logical errors 
        if (CheckLength(abstract) > abstract_char_limit) {
            var lengthError = {
                param: "abstract",
                msg: `Your abstract cannot be longer than ${abstract_char_limit} characters.`
            }
            errors.errors = [...errors.errors, lengthError];
        }

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        var obj = {
            title: he.decode(title),
            category,
            published,
            abstract: he.decode(abstract),
            author,
            datePublished: Date.now(),
        }
        if (typeof req.files != 'undefined' && req.files.thumbnail != null) {
            thumbnail = {
                data: req.files.thumbnail[0].buffer,
                contentType: req.files.thumbnail[0].mimetype,
            }
            obj.thumbnail = thumbnail;
        }
        if (typeof req.files != 'undefined' && req.files.images != null) {
            images = req.files.images.map(file => {
                return {
                    data: file.buffer,
                    contentType: file.mimetype
                }
            })
            obj.images = images;
        }
        try {
            const tagArray = JSON.parse(tag)
            async.waterfall([
                function (callback) {
                    const newPost = new Post(obj)
                    newPost.save()
                        .then(post => {
                            return callback(null, post)
                        })
                        .catch(e => {
                            console.log("Error in trying to create a new post 252: ", e)
                            callback({
                                param: "server",
                                msg: "Something went wrong when trying to create a post.",
                            });              
                        })
                }, 
                function (post, callback) {
                    try {
                        TagController.saveTagsFromNewPost(tagArray, post)
                            .then(tags => {
                                return callback(null, post, tags)
                            })
                            .catch(error => {
                                return callback(error)
                            })
                    }
                    catch (e) {
                        return callback(e)
                    }
                },
                function (post, tags, callback) {
                    const tagIDList = tags.map(item => item._id); 
                    const newUpdate = {
                        tag: tagIDList,
                        _id: post._id, 
                    } 
                    Post.findByIdAndUpdate(post._id, newUpdate, { new: true })
                        .then(updatedPost => {
                            console.log("Tags are successfully saved on post")
                            return callback(null, post, tags, updatedPost)
                        })
                        .catch(err => {
                            return callback(err)
                        })
                }
            ], (err, post, tags, updatedPost) => {
                console.log("updatedPost: ", updatedPost)
                res.status(200).json({ post: updatedPost, message: "Post is successfully created." })
            })

        } catch (e) {
            console.log("Error in trying to create new post: ", e.message)
            return res.status(404).json({ error: [{ param: "server", msg: `${e}` }] })
        }
    }
]


exports.EditPost=[]