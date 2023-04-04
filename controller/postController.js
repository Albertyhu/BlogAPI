const Post = require('../model/post.js'); 
const User = require('../model/user.js');
const Comment = require("../model/comment.js"); 
const { ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator') 


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
            .populate("category")
            .populate("comments")
            .populate("tag")
            .populate("likes")
            .exec()
        if (!result) {
            return res.status(404).json({ error: [{param: 'post', msg: "Post is not found." }]})
        }
        console.log(result)
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
        await Post.find({ category: { $elemMatch: { $eq: new ObjectId(req.params.categoryID) } } })
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
        await findByIdAndDelete(PostId, (err, docs) => {
            if (err) {
                return res.status(400).json({ message: `Error: ${err}` })
            }
            else {
                return res.status(200).json({ message: "Post has been deleted." })
            }
        })
    } catch (e) {
        res.status(500).json({ message: "Internal server error." })
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
    body("category")
        .custom((val) => {

        }),
    body("tag"),
    async (req, res) => {
        var errors = validationResult(req);
        //create a way to check if the post is posted under an existing category

        errors.errors = errors.errors.concat(DuplicateErrors);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        var thumbnail = null; 
        var images = null; 
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        if (req.files.thumnail) {
            thumbnail = {
                data:  req.files.thumbnail[0].buffer,
                contentType: req.files.thumbnail[0].mimetype,
            }
        }
        if (req.files.images) {
            images = req.files.images.map(file => {
                return {
                    data: file.buffer,
                    contentType: file.memetype
                }
            })
        }
        try {

        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            return res.status(404).json({ error: [{ param: "server", msg: `${e}` }] })
        }
    }
    
]