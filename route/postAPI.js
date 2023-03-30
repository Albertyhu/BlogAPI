const express = require('express');
const router = express.Router();
const cors = require('cors'); 
const postController = require('../controller/postController.js');
const { upload } = require('../middleware/multerSetup.js');

router.get('/', cors(), postController.AllPosts)

router.get('/:id', cors(), postController.FindOnePost)

router.put('/:id/like', cors(), postController.UpdateLikes)

module.exports = router; 