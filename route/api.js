const express = require('express');
const router = express.Router(); 
const cors = require('cors'); 
const UserController = require('../controller/userController.js'); 
const postController = require('../controller/postController.js'); 
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
    },
});


const upload = multer({
    limits: { fileSize: 1024 * 1024 * 5 },
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
    }
}); 


router.get('/', cors(), (req, res) => {
    res.json({ msg: 'This is CORS-enabled for a Single Route' })
}); 

router.get('/users/usernameandemail', cors(), UserController.GetUsernameAndEmails)

router.get('/users/:authorId/posts', cors(), postController.AllPostsByAuthor);

router.get('/users/:authorId/posts/postId', cors(), postController.GetOnePostByAuthor)

router.get('/users', cors(), UserController.GetAllUsers)

router.get('/users/:id', cors(), UserController.GetUser)

router.get('/users/:id/profilepicture', cors(), UserController.GetUserProfilePicture)

router.put('/users/:id/uploadnewpicture', cors(), upload.single("profile_pic"), UserController.UploadNewProfilePicture)

router.delete('/users/:id/delete', cors(), UserController.DeleteUser)

module.exports = router;    