const express = require('express');
const router = express.Router();
const cors = require('cors'); 
const postController = require('../controller/postController.js');
const { upload } = require('../middleware/multerSetup.js');
const { verifyToken } = require('../middleware/verifyMember.js') 
const commentController = require('../controller/commentController.js'); 

router.get('/', cors(), postController.AllPosts)

router.post("/create", cors(), verifyToken, upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 1000 }
]), postController.CreatePostAndUpdateTags)

router.get('/get_posts_by_category/:categoryID', cors(), postController.GetPostsByCategory);

router.get('/get_paginated_post_by_category/:categoryID/:page/:count', cors(), postController.GetPaginatedPostsByCategory);

router.get("/get_newest_posts/:page/:count", cors(), postController.GetAllPostByNewest);

router.get('/:id', cors(), postController.FindOnePost)

router.put("/:id/edit", cors(), verifyToken, upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "images", maxCount: 1000 }
]), postController.EditPost)

router.put('/:id/update_likes', cors(), verifyToken, upload.none(), postController.UpdateLikes)

router.put('/:id/add_like', cors(), verifyToken, upload.none(), postController.AddToLikes); 

router.put('/:id/remove_like', cors(), verifyToken, upload.none(), postController.RemoveLikes)

router.delete("/:id/delete", cors(), verifyToken, upload.none(), postController.DeletePostById);

router.post("/:id/add_comment", cors(), verifyToken, upload.array("images"), commentController.AddCommentToPost)

module.exports = router;     