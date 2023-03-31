const Post = require('../model/post.js'); 
const User = require('../model/user.js');
const { ObjectId } = require('mongodb');


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
            .exec()
        if (!result) {
            return res.status(404).json({message: "Post is not found."})
        }
        res.status(200).json(result); 
    } catch (e) {
        res.status(500).json({ message: "Internal server error." })
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
            _id: req.params.id,
        })
        await Post.findByIdAndUpdate(req.params.id, { newUpdate })
            .then(result => {
                console.log("Update is successful")
            })
            .catch(e => {
                console.log(`There is an error in updating likes on ${req.params.id}`)
            })
    } else {
        console.log(`There is a problem with the likes array passed from client`)
    }
}