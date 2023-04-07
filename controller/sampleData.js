const SampleUsers = require('../sampleData/sampleUsers.js'); 
const async = require('async'); 
const mongoose = require('mongoose');
const User = require('../model/user.js'); 
const SamplePosts = require('../sampleData/post2.js'); 
const Post = require('../model/post.js'); 
const SampleComments = require('../sampleData/comments.js'); 
const Comment = require('../model/comment.js'); 
const Category = require('../model/category.js'); 
const { pickCategoryId } = require('../util/randGen.js')

const PopulateUsers = data => {
    data.forEach( async person => {
        const newUser = new User(person);
        const result = await newUser.save();
        console.log("result: ", result) 
    })
}

const PopulatePosts = async data => {
    var copy = data; 
    const categoryList = await Category.find({})
    copy.forEach(val => {
        val.category = pickCategoryId(categoryList);
    })
    await Post.insertMany(copy)
        .then(() => {
           console.log("Posts are inserted.")
        })
        .catch((e) => {
            console.log("Error in uploading posts: ", e)
        })
}

const PopulateComments = async (data) => {
    await Comment.insertMany(data)
        .then(() => {
            console.log("Comments are inserted.")
        })
        .catch((e) => {
            console.log("Error in uploading comments: ", e)
        })
}

const DeleteAllPost = async () => {
    await Post.deleteMany({})
        .then(() => {
            console.log("All posts are successfully deleted")
        })
}


exports.populate = (req, res, next) => {
    async.parallel([
        () => { PopulatePosts(SamplePosts) }
        //() => { PopulateComments(SampleComments)}
        //() => DeleteAllPost(), 
    ],
        function (err, results) {
            if (err) {
                console.log("FINAL ERR: " + err);
            } else {
                console.log("Database is successfully populated");
            } 
            mongoose.connection.close(); 
        }
    )
} 