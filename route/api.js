const express = require('express');
const router = express.Router(); 
const cors = require('cors'); 
const UserController = require('../controller/userController.js'); 
const postController = require('../controller/postController.js'); 

router.get('/', cors(), (req, res) => {
    res.json({ msg: 'This is CORS-enabled for a Single Route' })
}); 

router.get('/users/usernameandemail', cors(), UserController.GetUsernameAndEmails)

router.get('/users/:authorId/posts', cors(), postController.AllPostsByAuthor);

router.get('/users/:authorId/posts/postId', cors(), postController.GetOnePostByAuthor)

router.get('/users', cors(), UserController.GetAllUsers)

router.get('/users/:id', cors(), UserController.GetUser)


//router.get('/register', cors(), AuthController.Register)

//router.get('/login', cors(), AuthController.SignIn)

//router.get('/login', )
module.exports = router;   