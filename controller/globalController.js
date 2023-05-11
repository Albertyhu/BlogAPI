const User = require('../model/user.js');
const Comment = require("../model/comment.js");
const Category = require('../model/category.js');
const Post = require("../model/post.js");
const Tag = require("../model/tag.js");
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
const async = require("async");
const ConnectionRequest = require('../model/connection_request.js'); 

exports.GetPopularCategoriesAndPosts = async (req, res, next) => {
    var COUNT;
    const error = []; 
    try {
        COUNT = parseInt(req.params.count);
    } catch (e) {
        error.push(e)
    }

    if (!Number.isInteger(COUNT) || COUNT <= 0 ) {
        error.push('Invalid count or pagination value');
    }
    if (error.length > 0) {
        console.log("GetPopularCategoriesAndPosts : ", error)
        return res.status(400).json({ error })
    }
    async.parallel({
        GetCategories(callback) {
            Category.aggregate([{
                    $project: {
                        _id: 1,
                        name: 1,
                        numPosts: { $size: { $ifNull: ["$post", []] } },
                    }
                    },
                    {
                        $sort: { numPosts: -1 }
                    },
                    {
                    $limit: COUNT,
                }], { maxTimeMS: 60000 })
                .then(topCategories => {
                    callback(null, topCategories)
                })
                .catch(error => {
                    console.log("GetPopularCategoriesAndPosts Error : ", error)
                    callback(error)
                }) 
        }, 
        GetPosts(callback) {
            Post.aggregate([
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        numComments: { $size: { $ifNull: ["$comments", []] } },
                        numLikes: {$size: "$likes"}
                    }
                },
                {
                    $sort: { numComments: -1 }
                },
                {
                    $limit: COUNT
                }
            ])
                .then(topPosts => {
                    callback(null, topPosts)

                })
                .catch(error => {
                    console.log("GetPopularCategoriesAndPosts Error : ", error)
                    callback(error)
                })
        }
    }, (error, result) => {
        if (error) {
            console.log("GetPopularCategoriesAndPosts error: ", error)
            res.status(500).json({ error })
        } 
        const TopPosts = result.GetPosts ? result.GetPosts : null;
        const TopCategories = result.GetCategories ? result.GetCategories : null;
        res.status(200).json({ TopPosts, TopCategories }) 
    })
} 