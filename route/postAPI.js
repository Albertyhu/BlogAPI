const express = require('express');
const router = express.Router();
const cors = require('cors'); 
const postController = require('../controller/postController.js');
const { upload } = require('../middleware/multerSetup.js');
const { verifyToken } = require('../middleware/verifyMember.js')
router.get('/', cors(), postController.AllPosts)

router.get('/get_posts_by_category/:categoryID', cors(), postController.GetPostsByCategory);

router.get('/:id', cors(), postController.FindOnePost)

router.put('/:id/update_likes', cors(), verifyToken, upload.none(), postController.UpdateLikes)

module.exports = router; 