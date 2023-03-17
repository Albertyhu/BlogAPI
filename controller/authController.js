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

//The option session dictates whether you want the server to handle storing
//a session for the user to be logged in. This is set to false, because we don't want
// the server to handle it. It's done using a token given to the client.
//This promotes stateless authentication. 
exports.Login = (req, res, next) => {
    passport.authenticate('local', { sesion: false }, (err, user, info) => {
        if (err) {
            return res.status(400).json({ error: err })
        }
        if (!user) {
            return res.status(400).json({ error: "User does not exist." });
        }
        req.login(user, { session: false }, (err) => {
            if (err) {
                res.send(err)
            }
        })
        const token = jwt.sign(user, process.env.JWT_SECRET);
        return res.json({ user, token });
    })(req, res);
}

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
        .escape(),
    body("password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long."),
    body("confirm_password")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Your password must be at least 4 characters long.")
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

        const {
            username,
            email,
            password,
            confirm_password,
        } = req.body; 

        console.log("req.body: ", req.body) 

        const errors = validationResult(req);
        if (!checkEmail(req.body.email)) {
            const obj = { 
                msg: "The email format is not valid. It must be something along the lines of Bob@email.com."
            }
            errors.errors.push(obj); 
        }
        if (!errors.isEmpty()) {
            return res.status(400).json({error: errors.array()});
        }
        return res.status(200).json({message: "Users is successfully save d in the database"})
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const obj = {
                username: username.replace(/\s/g, ''),
                email: email,
                password: hashedPassword,
              //  profile_pic: profile_pic,
                joinedDate: Date.now(),
                admin: false,
                member: false,
            }
            const newUser = new User(obj);
            await newUser.save((err, user) => {
                if (err) {
                    console.log("Error in trying to save user: ", err.message)
                    return next(err);
                }
                console.log("User is successfully created.")
                const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: 60 * 60})
                return res.status(200).json({ user, token }); 
            })
        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            res.status(500).json({ error: 'Server error' });
        }
    }
]

//for development purposes 
exports.RegisterTest = (req, res, next) => {
    console.log("req.body: ", req.body)
    if (typeof req.body == "undefined") {
        rest.status(500).json({message: "Something went wrong."})
    }
}


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