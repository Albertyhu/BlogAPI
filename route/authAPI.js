const express = require('express');
const router = express.Router();
const cors = require('cors');
const authController = require('../controller/authController.js'); 
const path = require('path')
const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${file.filename}${ext}`;
        cb(null, filename)
    }

});  
const upload = multer({ storage: storage }); 

//router.post('/register', cors(), upload.single("profile_pic"), authController.Register)
router.post('/register', cors(), authController.Register)

router.post('/login', cors(), authController.Login)


module.exports = router; 