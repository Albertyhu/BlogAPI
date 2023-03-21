const User = require('../model/user');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const checkEmail = require('../util/checkEmail.js')
const jwt = require('jsonwebtoken');
const passport = require("passport");

var dummyData = {
    username: "Bob",
    email: "bob@gmail.com",
    password: "test123",
    confirm_password: "test123",
}

exports.SignIn = (req, res, next) => {
    res.render('login', {
        user: req.user,
    })
}

exports.Login = async (req, res, next) => {
    const result = await User.findOne({ username: req.body.username }); 
    if (!result) {
        return res.status(404).json({ message: "There is no one in the database that goes by that username." });
    }
    else {
        if (!(await bcrypt.compare(req.body.password, result.password))) {
            return res.status(404).json({ message: "Password is incorrect." })
        }
        const user = {
            username: result.username,
            email: result.email,
            profile_pic: result.profile_pic,
            joinedDate: result.joinedDate, 
            id: result._id, 
        }
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: 60 * 60 })
        return res.status(200).json({user: user, token, message: "User is signed in."})
    }
}


exports.Register = [
    body("username")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You must type your username.")
        .escape(),
    body("email")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You must type your email address. ")
        .custom((value) => {
            if (!checkEmail(value)) {
                throw new Error("The email format is not valid. It must be something along the lines of Bob@email.com.");
            }
            return true; 
        }), 
    body("password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long."),
    body("confirm_password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your confirmation password must be at least 4 characters long.")
        .custom((value, { req }) => {
            if (value != req.body.password) {
                throw new Error("Your password and confirmation password should match.")
            }
            //this is necessary to indicate that the validation passed
            return true
        }),
    async (req, res, next) => {
        var profile_pic = null;
        if (req.file) {
            profile_pic = {
                data: fs.readFileSync(path.join(__dirname, '../public/uploads/', req.file.filename)),
                contentType: req.file.mimetype
            };
        }

        console.log("req.file: ", req.file)

        const {
            username,
            email,
            password,
            confirm_password,
        } = req.body; 

        const errors = validationResult(req);

        const UserList = await User.find({})

        UserList.forEach(val => {
            if (val.username == username.trim()) {
                const obj = {
                    param: "username",
                    msg: "That username already exists in our database."
                }
                errors.errors.push(obj)
            }
            if (val.email.toLowerCase() == email.trim().toLowerCase()) {
                const obj = {
                    param: "email",
                    msg: "That email already exists in our database."
                }
                errors.errors.push(obj)
            }
        })

        if (!errors.isEmpty()) {
            return res.status(400).json({error: errors.array()});
        }
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const obj = {
                username: username.replace(/\s/g, ''),
                email: email,
                password: hashedPassword,
                profile_pic: profile_pic,
                joinedDate: Date.now(),
                admin: false,
                member: false,
            }
            const newUser = new User(obj);
            const savedUser = await newUser.save(); 

            const userDate = {
                username: savedUser.username, 
                email: savedUser.email, 
                joinedDate: savedUser.joinedDate, 
                profile_pic: savedUser.profile_pic, 
                id: savedUser._id, 
            }

            console.log("User is successfully created.")
            const token = jwt.sign(savedUser.toJSON(), process.env.JWT_SECRET, { expiresIn: 60 * 60 })
            return res.status(200).json({ user: userDate, token, message: "User is successfully saved in the database" });
        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            res.status(500).json({ error: 'e.message' });
        }
    }
]

exports.ChangePassword_get = (req, res, next) => {
    res.render('user/passwordForm', {
        user: req.user,
        title: "Change your password",
        burgerMenu: "/assets/icon/hamburger_menu_white.png",
    })
}


exports.ChangePassword_post = [
    body('current_password')
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your current password must be at least 4 characters long.")
        .custom(async (val, { req }) => {
            if (!await bcrypt.compare(val, req.user.password)) {
                throw new Error('The current password you typed is not correct.');
            }
        }),
    body("password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long."),
    body("confirm_password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your confirmation password must be at least 4 characters long."),
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('user/passwordForm', {
                user: req.user,
                title: "Change your password",
                burgerMenu: "/assets/icon/hamburger_menu_white.png",
                error: errors.array(),
            })
            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const obj = {
                password: hashedPassword,
                _id: req.params.id,
            }
            const updateUser = new User(obj);
            User.findByIdAndUpdate(req.params.id, updateUser, {}, (err, result) => {
                if (err) {
                    console.log("Error in trying to update password of user: ", err.message)
                    return next(err);
                }
                console.log("User is successfully created.")
                res.redirect(`/passwordchanged`);
            })
        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            res.status(500).json({ error: 'Server error' });
        }
    }
]

