const User = require('../model/user');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const passport = require("passport");
const bcrypt = require('bcrypt');
const checkEmail = require('../util/checkEmail.js')

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

//exports.Login_Post = passport.authenticate("local", {
//    successRedirect: '/',
//    failureRedirect: '/login',
//    failureFlash: true,
//})

exports.Register_get = (req, res, next) => {
    //  const { username, email, password, confirm_password } = dummyData; 
    User.find({}, (err, result) => {
        if (err)
            return next(err);

        res.render("register", {
            user: req.user,
            existingUsers: result,
            title: "Create an account",
            burgerMenu: "/assets/icon/hamburger_menu_white.png",

        })
    })

}

exports.Register_post = [
    body("username")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You must type your username.")
        .escape(),
    body("email")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You must type your email address. ")
        .escape(),
    body("password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long."),
    body("confirm_password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long."),
    async (req, res, next) => {
        var profile_pic = null;
        if (req.file) {
            profile_pic = {
                data: fs.readFileSync(path.join(__dirname, '../public/uploads/', req.file.filename)),
                contentType: req.file.mimetype
            };
        }

        const {
            username,
            email,
            password,
            confirm_password,
        } = req.body;

        const errors = validationResult(req);
        if (!checkEmail(req.body.email)) {
            const obj = {
                msg: "The email format is not valid. It must be something along the lines of Bob@email.com."
            }
            errors.errors.push(obj)
        }
        if (!errors.isEmpty()) {
            res.render("register", {
                user: req.user,
                username: username,
                email: email,
                password: password,
                profile_pic: profile_pic,
                confirm_password: confirm_password,
                title: "Create an account",
                burgerMenu: "/assets/icon/hamburger_menu_white.png",
                error: errors.array(),
            })
            return;
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
            newUser.save((err, result) => {
                if (err) {
                    console.log("Error in trying to save user: ", err.message)
                    return next(err);
                }
                console.log("User is successfully created.")
                res.redirect(`/join/${result._id}`);
            })
        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            res.status(500).json({ error: 'Server error' });
        }
    }
]


exports.LogOut = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
}

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