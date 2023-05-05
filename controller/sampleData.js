const SampleUsers = require('../sampleData/sampleUsers.js'); 
const async = require('async'); 
const mongoose = require('mongoose');
const User = require('../model/user.js'); 
const SamplePosts = require('../sampleData/post.js'); 
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

//const PopulatePosts = async data => {
//    var copy = data;
//    const categoryList = await Category.find({})
//    copy.forEach(val => {
//        val.category = pickCategoryId(categoryList);
//    })
//    await Post.insertMany(copy)
//        .then(() => {
//           console.log("Posts are inserted.")
//        })
//        .catch((e) => {
//            console.log("Error in uploading posts: ", e)
//        })
//}

const PopulatePosts = async data => {
    var copy = data;
    const categoryList = await Category.find({})
    for (let post of data) {
        const categoryIndex = Math.floor(Math.random() * categoryList.length);
        const category = categoryList[categoryIndex];
        var newDate = Date.now()
        post.datePublished = newDate;
        post.lastEdited = newDate; 
        post.category = category._id; 
        // Create a new Post document and set its properties
        const newPost = new Post(post);

        // Save the new Post document to the database
        await newPost.save();

        // Update the corresponding Category document by adding the new post to its post array
       // category.post.push(newPost._id);
        //await category.save();
        await Category.findByIdAndUpdate(category._id, {
            $addToSet: {post: newPost._id}
        }).then(()=>console.log("Sample post successfully created in the database."))
    }
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
    async.parallel([
        function (callback) {
           Post.deleteMany({})
               .then(() => {
                    callback(null)
                    console.log("All posts are successfully deleted")
                })
               .catch(error => {
                   console.log("error: ", error)
               })
        },
        function (callback) {
            Category.updateMany({}, {
                $unset: {post: 1}
            }, { multi: true })
                .then(() => {
                    callback(null)
                    console.log("Categories are successfully updated.")
                })
                .catch(error => {
                    console.log("error: ", error)
                })
        }
    ], (error) => {
        if (error) {
            console.log("DeleteAllPost error: ", error)
        }
    })
}

const DeleteAllPostIdFromCategory = async () => {}

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
         //() => DeleteAllPost(),
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