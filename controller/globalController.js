const User = require('../model/user.js');
const Comment = require("../model/comment.js");
const Category = require('../model/category.js');
const Post = require("../model/post.js");
const Tag = require("../model/tag.js");
const User = require("../modle/user.js"); 
const dataHooks = require('../util/dataHooks.js');

const { body, validationResult } = require("express-validator");
const checkEmail = require('../util/checkEmail.js');
const he = require('he');
const { findDuplicateNameAndEmail } = dataHooks();
const {
    BufferImage,
    BufferArrayOfImages,
} = require("../util/imageHooks.js")
const UserPhoto = require('../model/user_photo.js')
const Category = require("../model/category.js");
const async = require("async");
const ConnectionRequest = require('../model/connection_request.js'); 

const RetrieveSearchData = async (req, res, next) => {
    async.parallel({
        GetUsers(callback) {
            User.find({})
                .select("username email")
                .sort({ username: 1 })
                .then(users => callback(null, users))
                .catch(error => {
                    console.log("There is a problem with retrieving the list of users: ", error)
                    callback(error)
                })
        },
        GetCategories(callback) {
            Category.find({})
                .select("name")
                .sort({ name: 1 })
                .then(categories => callback(null, categories))
                .catch(error => {
                    console.log("There is a problem with retrieving the list of categories: ", error)
                    callback(error)
                })
        },
        GetPosts(callback) {
            Post.find({ published: true })
                .select("title content tag")
                .sort({ title: 1 })
                .populate({
                    path: "tag",
                    model: "Tag"
                })
        },


    })
}