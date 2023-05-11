const express = require('express');
const router = express.Router();
const cors = require('cors');
const authController = require('../controller/authController.js'); 
const path = require('path')
const multer = require('multer');
const { upload } = require('../middleware/multerSetup.js');

router.post('/register', cors(), upload.single('profile_pic'), authController.Register)

router.post('/login', cors(), upload.none(), authController.Login)

module.exports = router; 