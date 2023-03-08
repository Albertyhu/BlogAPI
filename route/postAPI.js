const express = require('express');
const router = express.Router();
const cors = require('cors'); 
const postController = require('../controller/postController.js');

router.get('/', cors(), postController.AllPosts)

router.get('/:id', cors(), postController.FindOnePost)

router.get('/:id/like', cors(), postController.HandleLikeToggle)

module.exports = router; 