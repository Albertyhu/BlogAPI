const Post = require('../model/post.js'); 
const Category = require('../model/category.js');
const { body, validationResult } = require('express-validator')
const he = require('he'); 
const TagController = require('./tagController.js'); 
const async = require('async');
const User = require('../model/user.js'); 

const {
    BufferImage,
    BufferArrayOfImages,
} = require("../util/imageHooks.js"); 

exports.AllPosts = async (req, res, next) => {
    try {
        var post = await Post.find({published: true})
            .sort({ datePublished: -1 })
            .populate({
                path: "author",
                model: "User",
                select: "username email joinedDate posts profile_pic biography coverPhoto _id"
            })
            .populate("tag")
            .exec() 
        if (post) {
            res.status(200).json({ post });
        }
        else {
            res.status(404).json({message: "No posts yet"})
        }
    } catch (e) {
        res.status(500).json({ message: "Internal server error." })
    }
}

exports.GetPostSearchData = async (req, res, next) => {
    await Post.find({ published: true })
        .select("title content tag datePublished lastEdited abstract likes comments")
        .sort({ title: 1 })
        .populate({
            path: "author",
            model: "User",
            select: "username _id"
            })
        .populate({
            path: "tag",
            model: "Tag"
        }).then(result => {
            const data = result.map(({ _id, title, author, content, tag, abstract, datePublished, lastEdited, likes, comments }) => {
                const collectedStrings = []
                collectedStrings.push(content);
                collectedStrings.push(abstract);
                collectedStrings.push(author.username)
                tag.forEach(item => {
                    collectedStrings.push(item.name)
                })
                collectedStrings.push(he.decode(title))
                return{
                    _id,
                    title,
                    content,
                    tag,
                    abstract, 
                    author,
                    collectedStrings, 
                    datePublished,
                    lastEdited,
                    likes,
                    comments,
                }
            });
            res.status(200).json({ data })
        })
        .catch(error => {
            console.log("GetPostSearchData error: ", error)
            res.status(400).json({ error })
        })
}

exports.FindOnePost = async (req, res, next) => {
    try {
        const PostId = req.params.id; 
        const result = await Post.findById(PostId)
            .populate("category")
            .populate({
                path: 'author',
                model: "User",
                select: "username email joinedDate _id", 
            })
            .populate({
                path: 'comments',
                model: "Comment",
                populate: [
                    {
                        path: 'author',
                        model: 'User', 
                    },
                    {
                        path: "replies",
                        model: "Comment",
                        populate: {
                            path: 'author',
                            model: 'User',
                        }
                    },
                    ]
            })
            .populate("tag")
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
            .populate({
                path: "author",
                model: "User",
                select: "username email joinedDate posts profile_pic biography coverPhoto _id"
            })
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
            .populate({
                path: "author",
                model: "User",
                select: "username email joinedDate posts profile_pic biography coverPhoto _id"
            })
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

exports.GetPaginatedPostsByCategory = async (req, res, next) => {
    try {
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
            console.log("GetPaginatedPostsByCategory error: ", error)
            return res.status(400).json({ error })
        }

        const start = PAGINATION * COUNT;
        await Post.find({ category: req.params.categoryID, published: true })
            .skip(start)
            .limit(COUNT)
            .sort({lastEdited: -1})
            .populate({
                path: "author",
                model: "User",
                select: "username email joinedDate posts profile_pic biography coverPhoto _id"
            })
            .populate("tag")
            .then(paginatedResult => {
                res.status(200).json({ paginatedResult })
            }).catch(e => {
                console.log("There was an error retrieving posts by category: ", e)
                res.status(500).json({ error: [{ param: "server", msg: `Internal server error.` }] })
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
                        return callback(null)
                    })
                    .catch(e => {
                        console.log("DeletePostById Error in 2nd function: ", e)
                        return callback(e)
                    })
            },
            //update category
            function (callback) {
                Category.findOneAndUpdate({ post: { $in: PostId } }, {
                    $pull: {post: PostId}, 
                })
                    .then(result => {
                        return callback(null)
                    })
                    .catch(e => {
                        console.log("DeletePostById Error in 2nd function: ", e)
                        return callback(e)
                    })
            }
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

exports.UpdateLikes = async (req, res, next) => {
    if (req.body.updatedLikes) {
        await Post.findByIdAndUpdate(req.params.id, { likes: JSON.parse(req.body.updatedLikes) } , {new: true})
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
        await Post.findByIdAndUpdate(req.params.id, {
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
        await Post.findByIdAndUpdate(req.params.id, {
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
        //if (typeof req.files.mainImage != 'undefined' && req.files.mainImage != null) {
        //    mainImage = {
        //        data: req.files.mainImage[0].buffer,
        //        contentType: req.files.mainImage[0].mimetype,
        //    }
        //    obj.mainImage = mainImage;
        //}
        if (typeof req.files.mainImage != 'undefined' && req.files.mainImage != null) {
            obj.mainImage = await BufferImage(req.files.mainImage[0]);
        }

        if (typeof req.files.images != 'undefined' && req.files.images.length > 0) {
            obj.images = await BufferArrayOfImages(req.files.images)
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
                            callback(null, post, tags, updatedPost)
                        })
                        .catch(err => {
                            callback(err)
                        })
                },
                function (post, tags, updatedPost, callback) {
                    Category.findByIdAndUpdate(category, {
                        $addToSet: {post: post._id}, 
                    })
                        .then((updatedCategory) => callback(null, post, tags, updatedPost, updatedCategory))
                        .catch(err => {
                            callback(err)
                        })
                },
                function (post, tags, updatedPost, updatedCategory, callback) {
                    User.findByIdAndUpdate(author, {
                        $addToSet: {posts : post._id}
                    }).then(() => callback(null, post, tags, updatedPost, updatedCategory))
                        .catch(err => {
                            callback(err)
                        })
                }
            ], (err, post, tags, updatedPost, updatedCategory) => {
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
    body("keepImages"),
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

        if (typeof req.files.mainImage != 'undefined' && req.files.mainImage != null) {
            obj.mainImage = await BufferImage(req.files.mainImage[0]);
        }

        var keepImages = []; 
        //check to see if there are existing images in the images array. 
        if (req.body.keepImages) {
            keepImages = JSON.parse(req.body.keepImages); 
        }
        var newImages = null;

        if (typeof req.files.images != 'undefined' && req.files.images.length > 0) {
            newImages = await BufferArrayOfImages(req.files.images)
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
            // tagsToKeep is a list of old tags that the user wants to keep for the post. 
            var tagsToKeep = tagArray.filter(val => typeof val._id != "undefined" && val._id != null); 
             
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
                //delete old images and keep certain images
                function (post, callback) {
                    var toDelete = post.images.filter(img => !keepImages.some(val => val.toString() == img._id.toString()))
                    var toDeleteID = toDelete.map(item => item._id); 
                    Post.updateOne({ _id: req.params.id }, {
                        $pull: {
                            images: {
                                _id: { $in: toDeleteID }
                            }
                        },
                    }, { new: true })
                        .then((deleteResult) => {
                           // return callback(null, post)
                            return callback(null, post, deleteResult)
                        })
                        .catch(error => {
                            return callback(error)
                        })
                },
                //add new images 
                function (post, deleteResult, callback) {
                    if (newImages) {
                        Post.updateOne({ _id: req.params.id },
                            {
                                $addToSet: {
                                    images: { $each: newImages }
                                },
                            },
                            { new: true }
                        )
                            .then(AddImagesResult => {
                                //return callback(null, post)
                                return callback(null, post, deleteResult, AddImagesResult)
                            })
                            .catch(error => {
                                return callback(error)
                            })
                    }
                    else {
                        return callback(null, post, deleteResult, null)
                    }
                },
                //Remove tags from post 
                function (post, deleteResult, AddImagesResult, callback) {
                    TagController.RemovePostFromTags(tagsToKeep, oldTagList, req.params.id)
                        .then(RemoveTagsResult=> {
                            return callback(null, post, deleteResult, AddImagesResult, RemoveTagsResult)
                        })
                        .catch(error => callback(error))
                },
                //save the ObjectId of post to the tags 
                function (post, deleteResult, AddImagesResult, RemoveTagsResult, callback) {
                    TagController.savePostIDToTags(newTags, post)
                        .then(newlyAddedTags => {
                            //updatedTagList will containg the old and new tags with their name and ObjectID's
                            var updatedTagList = newlyAddedTags.concat(tagsToKeep)
                            return callback(null, post, deleteResult, AddImagesResult, RemoveTagsResult, updatedTagList)
                        })
                        .catch(error => {
                            return callback(error)
                        })
                },
                //Add tags to post
    function (post, deleteResult, AddImagesResult, RemoveTagsResult, updatedTagList, callback) {
                    const newUpdate = {
                        tag: updatedTagList,
                        _id: req.params.id,
                    }
                    Post.findByIdAndUpdate(req.params.id, newUpdate, { new: true })
                        .then(updatedPost => {
                            console.log("Tags are successfully saved on post")
                            return callback(null, post, deleteResult, AddImagesResult, RemoveTagsResult, updatedTagList, updatedPost)
                        })
                        .catch(err => {
                            return callback(err)
                        }) 
                },
                ], (err, post, deleteResult, AddImagesResult, RemoveTagsResult, updatedTagList, updatedPost) => {
                if (err) {
                    console.log("There is an error in updating post: ", err)
                    res.status(400).json({ error: [{param: "general", msg: err}]})
                }
              //  console.log("updatedPost: ", updatedPost)
                res.status(200).json({ post: updatedPost, message: "Post is successfully updated." })
            })

        } catch (e) {
            console.log("Error in trying to update post: ", e.message)
            return res.status(404).json({ error: [{ param: "server", msg: `${e}` }] })
        }
    }
]

exports.GetAllPostByNewest = async (req, res, next) => {
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
    await Post.find({ published: true })
        .sort({ lastEdited: -1 })
        .skip(start)
        .limit(COUNT)
        .populate({
            path: "author",
            model: "User",
            select: "username email joinedDate posts profile_pic biography coverPhoto _id"
        })
        .populate("tag")
        .populate('category')
        .then(paginatedResult => {
            return res.status(200).json({ paginatedResult })
        })
        .catch(error => {
            console.log("GetAllPostByNewest error: ", error)
            return res.status(500).json({ error })
        })
}

exports.GetPaginatedPostsByUser = async (req, res, next) => {
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
    var filter = {
        author: req.params.userid
    }
 
    if (req.params.display_only_published === 'true') {
        filter.published = true; 
        console.log("displayonlypublished: ", true)
    }
    await Post.find(filter)
        .sort({ lastEdited: -1 })
        .skip(start)
        .limit(COUNT)
        .populate({
            path: "author",
            model: "User",
            select: "username email joinedDate posts profile_pic biography coverPhoto _id"
        })
        .populate("tag")
        .populate('category')
        .then(paginatedResult => {
            return res.status(200).json({ paginatedResult })
        })
        .catch(error => {
            console.log("GetAllPostByNewest error: ", error)
            return res.status(500).json({ error })
        })
}