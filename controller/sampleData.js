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
const bcrypt = require('bcrypt')

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
    for (let post of data) {
        const categoryIndex = Math.floor(Math.random() * categoryList.length);
        const category = categoryList[categoryIndex];
        var newDate = Date.now()
        post.datePublished = newDate;
        post.lastEdited = newDate; 
        post.category = category._id; 
        post.published = true; 
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
        },
        function (callback) {
            User.updateMany({}, {
                $unset: {posts: 1}
            }, { multi: true })
                .then(() => {
                    callback(null)
                    console.log("Users are successfully updated.")
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


const UploadComments = async (comments) => {
    async.waterfall([
        function (callback) {
            Post.find({})
                .then(postList => callback(null, postList))
                .catch(error => {
                    console.log("there was an error retrieving posts: ", error)
                    callback(error)
                })
        },
        function (postList, callback) {
            User.find({})
                .then(userList => callback(null, postList, userList))
                .catch(error => {
                    console.log("There was an error retrieving users: ", error)
                    callback(error)
                })
        },
        function (postList, userList, callback) {

            const newComments = comments.map(comment => {
                const selectedPost = postList[Math.floor(Math.random() * postList.length)];
                const selectedUser = userList[Math.floor(Math.random() * userList.length)];
                const content = `<p>${comment.content}</p>`
                return {
                    content, 
                    datePublished: comment.dateCreated, 
                    lastEdited: comment.dateCreated, 
                    author: selectedUser._id, 
                    likes: comment.likes,
                    post: selectedPost._id, 
                }
            })
            Comment.insertMany(newComments)
                .then(commentList => callback(null, postList, userList, commentList))
                .catch(error => {
                    console.log("There was a problem creating new comments: ", error)
                    callback(error)
                })
        },
        function (postList, userList, commentList, callback) {
            const promises = commentList.map(item => {
                return Post.findByIdAndUpdate(item.post, {
                    $addToSet: { comments: item._id }
                })
            })
            Promise.all(promises)
                .then(() => callback(null, postList, userList, commentList))
                .catch(error => {
                    console.log("There was a problem updating the posts: ", error)
                    callback(error)
                });
        } 
    ], (error) => {
        if (error) {
            console.log(error)
        }
    })
}

const DeleteComments = async () => {
    async.waterfall([
        function (callback) {
            Comment.find({})
                .then(commentList => callback(null, commentList))
                .catch(error => {
                    console.log("There was an error retrieving all comments: ", error)
                })
        },
        function (commentList, callback) {
            Comment.deleteMany({})
                .then(deleteResult => callback(null, commentList, deleteResult))
                    .catch(error => {
                        console.log("There was an error deleting all comments: ", error)
                    })
        },
        function (commentList, deleteResult, callback) {
            const promises = commentList.map(item => {
                return Post.findByIdAndUdpate(item.post, {
                    $pull: {comments: item._id}
                })
            })
            Promise.all(promises)
                .then(() => callback(null))
                .catch(error => {
                    console.log("There was a problem updating the posts: ", error)
                    callback(error)
                });
        }
    ], (error) => {
        if (error) {
            console.log(error)
        }
    })
}

const updateAllPosts = async (update) => {
    await Post.updateMany({}, update)
        .then(() => {
            console.log("All posts have been updated: ", update)
        })
        .catch(error => {
            console.log("updateAllPosts error: ", error)
        })
}

//const HashPassword = async (id) => {
//    async.waterfall([
//        function (callback) {
//            User.findById(id)
//                .then(user => callback(null, user))
//                .catch(error => {
//                    console.log("Error encountered when trying to find user: ", error)
//                    callback(error)
//                })
//        },
//        async function (user, callback) {
//                bcrypt.hash(user.password, 10)
//                    .then(hashedPassword => callback(null, user, hashedPassword))
//                    .catch(error => {
//                        console.log("Error trying to hash password: ", error)
//                        callback(error)
//                    }) 
//        },
//        function (user, hashedPassword, callback) {
//            User.findByIdAndUpdate(id, {
//                password: hashedPassword,
//            })
//                //.then((updatedUser) => { callback(null, user, hashedPassword, updatedUser) })
//                //.catch(error => {
//                //    console.log("Error encountered when trying to update password: ", error)
//                //    callback(error)
//                //})
//        }
//    ], (error) => {
//        if (error) {
//            console.log("HashPassword error: ", error)
//        }
//        console.log("Password is successfully hashed.")
//    })
//}

const HashPassword = async (id, password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        console.log("hashedPassword: ", hashedPassword)
        User.findByIdAndUpdate(id, {
            password: hashedPassword,
        })
            .then((updated) => {
                console.log("Password is successfully updated: ")
            })
            .catch(error => {
                console.log("Error trying to update user: ", error)
            })
    } catch (error) {
        console.log("Error trying to hash password: ", error)
    }

}

exports.populate = (req, res, next) => {
    async.parallel([
        //() => { PopulatePosts(SamplePosts) },
        //() => { PopulateComments(SampleComments)},
        //() => { UploadComments(SampleComments)}
         //() => DeleteAllPost(),
        //()=>DeleteCommments()
        //() => { DeletePostsByTitle("How to pet a dog")},
        //() => DeleteAllPhotos(),
        () => HashPassword("640679c46edb54e6d6e34c3f", "pass123"), 
        //() => updateAllPosts({
        //    published: true
        //    })
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