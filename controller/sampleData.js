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
const UserPhoto = require("../model/user_photo.js"); 

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

const DeleteAllPhotos = async () => {
    await UserPhoto.deleteMany({})
        .then(() => {
            console.log("All user photos are successfully deleted")
        })
        .catch(e => {
            console.log("DeleteAllPhotos error: ", e)
        })
}

const DeletePostsByTitle = async (title) => {
    await Post.deleteMany({ title: title })
        .then(() => {
            console.log(`All posts with the titile ${title} are deleted`); 
        })
        .catch(e => {
            console.log("DeletePostsByTitle error: ", e)
        })
}


exports.populate = (req, res, next) => {
    async.parallel([
        () => { PopulatePosts(SamplePosts) },
        //() => { PopulateComments(SampleComments)},
        // () => DeleteAllPost(),
        //() => { DeletePostsByTitle("How to pet a dog")},
        //() => DeleteAllPhotos(), 
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