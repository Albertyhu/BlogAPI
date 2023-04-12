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
        async.parallel([
            function(callback){
               return Post.deleteOne({ _id: PostId })
                   .then(post => {
                       console.log("The post has been deleted.")
                       return callback(null, post)
                    })
                   .catch(e => {
                       console.log("DeletePostById Error in 1st function: ", e)
                       return callback(e)
                   })
            }, 
            function (callback) {
                TagController.RemovePostFromAllTags(PostId)
                    .then(result => {
                        console.log("After removing post from tags: ", result)
                        return callback(null)
                    })
                    .catch(e => {
                        console.log("DeletePostById Error in 2nd function: ", e)
                        return callback(e)
                    })
            },
        ], (error, post) => {
            if (error) {
                console.log('Callback error: ', error)
                return res.status(500).json({ error: [{param: "server", msg: "Someone went wrong in the server"}]})
            }
            console.log("result: ", post)
            console.log(`The post has been deleted`)
            return res.status(200).json({message: "The post has been deleted."})
        })
    } catch (e) {
        res.status(500).json({ error: [{ param: "server", msg: `Internal server error: ${e}` }] })
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
    body("abstractExceedLimit"),
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
            content, 
            abstractExceedLimit,
            abstract_char_limit,
            tag,
            author,
        } = req.body;

        var thumbnail = null;
        var images = null;

        if (abstractExceedLimit) {
            var lengthError = {
                param: "abstract",
                msg: `Your abstract cannot be longer than ${abstract_char_limit} characters.`
            }
            errors.errors = [...errors.errors, lengthError];
        }

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        const DatePublished = Date.now()
        var obj = {
            title: he.decode(title),
            category,
            published,
            abstract: he.decode(abstract),
            content: he.decode(content), 
            author,
            datePublished: DatePublished,
            lastEdited: DatePublished, 
        }
        console.log('req.files: ', req.files)
        if (typeof req.files != 'undefined' && req.files.thumbnail != null) {
            console.log("req.files.thumbnail: ", req.files.thumbnail)
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
                        TagController.savePostIDToTags(tagArray, post)
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
                    const tagIDList = tags.map(item => item.toString()); 
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


exports.EditPost = [
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
    body("abstractExceedLimit"),
    body("abstract_char_limit"),
    body("priorTagList"),
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
            content,
            abstractExceedLimit,
            abstract_char_limit,
            tag,
            author,
        } = req.body;


        var thumbnail = null;
        var images = null;

        if (abstractExceedLimit) {
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
            content: he.decode(content),
            author,
            lastEdited: Date.now(),
        }
        if (typeof req.files != 'undefined' && req.files.thumbnail != null) {
            thumbnail = {
                data: req.files.thumbnail[0].buffer,
                contentType: req.files.thumbnail[0].mimetype,
            }
            obj.thumbnail = thumbnail; 
        }
        //var thumbnail = {};
        //thumbnail.data = req?.files?.thumbnail[0]?.buffer;
        //thumbnail.contentType = req?.files?.thumbnail[0]?.mimetype;
        //obj.thumbnail = Obj.keys(thumbnail).length > 0 ? thumbnail: null;

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
            //oldTagList: This is the tag list that exist before the user updates the tag list.
            //This list will have old tags that the user wants to keep and tags that the user wants to remove
            //Thus, it is necessary to filter for tags to be deleted from the post. 
            var oldTagList = []; 
            try {
                oldTagList = JSON.parse(req.body.priorTagList)
            }
            catch (e) {
                console.log('There is an error with parsing the oldTagList: ', e)
                console.log("req.body.priorTagList: ", req.body.priorTagList)
                console.log("oldTagList: ", oldTagList)
            }

            //updated tag list: This is the list that includes both new and old tags. The new tags will only have the field name
            //Thus, the tag controller function savePostIDToTags will create ObjectId's for thos tags.
            var tagArray = [];
            try {
                tagArray = JSON.parse(req.body.tag)
            } catch (e) {
                console.log('There is an error with parsing the tagArray: ', e)
                console.log("req.body.tag: ", req.body.tag)
            }

            //newTags is the list of newly added tags to the post
            var newTags = tagArray.filter(val => val._id == null || typeof val._id == "undefined")
            console.log("newTags: ", newTags)
            // tagsToKeep is a list of old tags that the user wants to keep for the post. 
            var tagsToKeep = tagArray.filter(val => typeof val._id != "undefined" && val._id != null); 

            //this is wrong, new tags don't have id's yet.
            //obj.tag = tagArray; 
             
            async.waterfall([
                function (callback) {
                    Post.findByIdAndUpdate(req.params.id, obj, {new: true})
                        .then(post => {
                            return callback(null, post)
                        })
                        .catch(e => {
                            console.log("Error in trying update post: ", e)
                            return callback(e);

                        })
                },
                function (post, callback) {
                    TagController.RemovePostFromTags(tagsToKeep, oldTagList, req.params.id)
                        .then(()=> {
                            return callback(null, post)
                        })
                        .catch(error => callback(error))
                },
                function (post, callback) {
                    TagController.savePostIDToTags(newTags, post)
                        .then(newlyAddedTags => {
                            console.log("newlyAddedTags: ", newlyAddedTags)
                            //updatedTagList will containg the old and new tags with their name and ObjectID's
                            var updatedTagList = newlyAddedTags.concat(tagsToKeep)
                            console.log("updatedTagList: ", updatedTagList)
                            return callback(null, post, updatedTagList)
                        })
                        .catch(error => {
                            return callback(error)
                        })
                },
                function (post, updatedTagList, callback) {
                    const newUpdate = {
                        tag: updatedTagList,
                        _id: req.params.id,
                    }
                    Post.findByIdAndUpdate(req.params.id, newUpdate, { new: true })
                        .then(updatedPost => {
                            console.log("Tags are successfully saved on post")
                            return callback(null, updatedPost)
                        })
                        .catch(err => {
                            return callback(err)
                        })
                }
            ], (err, updatedPost) => {
                if (err) {
                    console.log("There is an error in updating post: ", err)
                    res.status(400).json({ error: [{param: "general", msg: err}]})
                }
                console.log("updatedPost: ", updatedPost)
                res.status(200).json({ post: updatedPost, message: "Post is successfully updated." })
            })

        } catch (e) {
            console.log("Error in trying to update post: ", e.message)
            return res.status(404).json({ error: [{ param: "server", msg: `${e}` }] })
        }
    }
]