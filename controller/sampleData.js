const SampleUsers = require('../sampleData/sampleUsers.js'); 
const async = require('async'); 
const mongoose = require('mongoose');
const User = require('../model/user.js'); 
const SamplePosts = require('../sampleData/post.js'); 
const Post = require('../model/post.js'); 

const PopulateUsers = data => {
    data.forEach( async person => {
        const newUser = new User(person);
        const result = await newUser.save();
        console.log("result: ", result) 
    })
}

const PopulatePosts = data => {
    Post.insertMany(data)
        .then(() => {
           console.log("Posts are inserted.")
        })
        .catch((e) => {
            console.log("Error in uploading posts: ", e)
        })
}

const DeleteAllPost = () => {
    Post.remove({})
        .then(() => {
            console.log("All posts are successfully deleted")
        })
}


exports.populate = (req, res, next) => {
    async.parallel([
        () => { PopulatePosts(SamplePosts)}
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