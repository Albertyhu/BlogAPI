const express = require('express');
const router = express.Router(); 
const cors = require('cors'); 
const UserController = require('../controller/userController.js'); 
const postController = require('../controller/postController.js'); 
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js"); 
const { upload } = require("../middleware/multerSetup.js");
const GlobalController = require("../controller/globalController.js"); 

router.get('/', cors(), (req, res) => {
    res.json({ msg: 'This is CORS-enabled for a Single Route' })
}); 

router.get("/users_and_categories", cors(), UserController.GetUsersAndCategories); 

router.get("/get_popular_categories_and_posts/:count", cors(), GlobalController.GetPopularCategoriesAndPosts)

module.exports = router;     