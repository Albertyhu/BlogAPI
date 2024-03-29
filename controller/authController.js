const User = require('../model/user');
const { body, validationResult } = require('express-validator'); 
const bcrypt = require('bcrypt');
const checkEmail = require('../util/checkEmail.js')
const jwt = require('jsonwebtoken');
const he = require('he');
const sharp = require('sharp');

exports.SignIn = (req, res, next) => {
    res.render('login', {
        user: req.user,
    })
}

exports.Login = async (req, res, next) => {
    var errors = []; 
    try {
        const result = await User.findOne({ username: req.body.username })

        if (!result) {
            const error = {
                param: "username",
                msg: "There is no one in the database that goes by that username.",
            }
            errors.push(error)
        }
        else {
            const passwordValid = await bcrypt.compare(req.body.password, result.password)
            if (!passwordValid) {
                const error = {
                    param: "password",
                    msg: "Password is incorrect",
                }
                errors.push(error)
            }
        }
        if (errors.length > 0) {
            return res.status(404).json({ error: errors })
        }
        const user = {
            username: result.username,
            email: result.email,
            joinedDate: result.joinedDate,
            id: result._id,
            "role": "member", 
        }
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: 60 * 60 })

        return res.status(200).json({
            user: user,
            token,
            message: "User is signed in.", 
            profile_pic: result.profile_pic ? result.profile_pic : null,
            connection: result.connection, 
        })
    } catch (e) {
        return res.status(500).json({ error: [{param: "server", msg: "Internal service error: " + e }]})
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
    body("profile_pic"),
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
        const {
            username,
            email,
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
                username: he.decode(username.replace(/\s/g, '')),
                email: he.decode(email),
                password: hashedPassword,
                joinedDate: Date.now(),
            }

            if (req.file) {
                const compressedImage = await sharp(req.file.buffer)
                    .resize(800) // Resize the image to a maximum width of 800 pixels
                    .jpeg({ quality: 75 }) // Compress the image using JPEG format with a quality of 80%
                    .toBuffer();

                obj.profile_pic = {
                    data: compressedImage,
                    contentType: req.file.mimetype,
                }
            }

            const newUser = new User(obj);
            const result = await newUser.save();

            const savedUser = {
                username: result.username,
                email: result.email,
                joinedDate: result.joinedDate,
                id: result._id,
                "role": "member", 
            }
            const token = jwt.sign(savedUser, process.env.JWT_SECRET, { expiresIn: 60 * 60 })
            res.status(200).json({
                user: savedUser,
                token,
                message: "User is successfully saved in the database",
                profile_pic: result.profile_pic ? result.profile_pic : null, 
            });
        } catch (e) {
            console.log("Error in trying to create new user: ", e.message)
            res.status(500).json({ error: e.message });
        }
    }
]

