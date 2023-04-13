const express = require('express');
const router = express.Router();
const cors = require('cors'); 
const postController = require('../controller/postController.js');
const { upload } = require('../middleware/multerSetup.js');
const { verifyToken } = require('../middleware/verifyMember.js') 

router.get('/', cors(), postController.AllPosts)

router.post("/create", cors(), verifyToken, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 1000 }
]), postController.CreatePostAndUpdateTags)

//router.post("/create",
//    cors(),
//    verifyToken,
//    upload.single('thumbnail'),
//    upload.array('images', 1000), 
//    postController.CreatePostAndUpdateTags)

//router.post("/create", cors(), verifyToken, upload.none(), postController.CreatePostAndUpdateTags)

router.get('/get_posts_by_category/:categoryID', cors(), postController.GetPostsByCategory);

router.get('/:id', cors(), postController.FindOnePost)


router.put("/:id/edit", cors(), verifyToken, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 1000 }
]), postController.EditPost)

//router.put("/:id/edit", cors(), verifyToken, upload.none(), postController.EditPost)

router.put('/:id/update_likes', cors(), verifyToken, upload.none(), postController.UpdateLikes)

router.delete("/:id/delete", cors(), verifyToken, upload.none(), postController.DeletePostById);

module.exports = router;     