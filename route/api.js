const express = require('express');
const router = express.Router(); 
const cors = require('cors'); 
const UserController = require('../controller/userController.js'); 
const postController = require('../controller/postController.js'); 
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js"); 
const { upload } = require("../middleware/multerSetup.js");

router.get('/', cors(), (req, res) => {
    res.json({ msg: 'This is CORS-enabled for a Single Route' })
}); 

module.exports = router;     