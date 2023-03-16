const express = require('express')
const path = require('path'); 
const mongoose = require('mongoose'); 
var bodyParser = require('body-parser');
const app = express(); 
const dotenv = require('dotenv'); 
const cors = require('cors'); 

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}

const passport = require('passport'); 
var corsOptions = {
    origin: ["http://localhost:3000"],
    optionsSuccessStatus: 200
}

const mongoDb = `${process.env.MONGOURL}`;

mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "mongo connection error"));

app.set('views', __dirname + '/views'); 
app.set('view engine', "EJS"); 

const mainRoute = require('./route/api.js'); 
const postRoute = require('./route/postAPI.js');
const authRoute = require('./route/authAPI.js'); 

app.use(cors()); 

app.use('/', mainRoute); 
app.use('/post', postRoute);
app.use('/auth', authRoute);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

//This makes sure that the corsOptions are universally applied 
app.options('*', cors(corsOptions));

const { populate } = require('./controller/sampleData.js')
//populate(); 

app.use(function (req, res, next) {
    next(createError(404));
})

app.use(function (err, req, res, next) {
    res.locals.message = err.message; 
    res.status(err.status || 500); 
    res.render("error", {
        user: req.user,
        title: "Error",
        error: err.message, 
        burgerMenu: "/assets/icon/hamburger_menu_white.png",
    })

})
app.listen(80, function () {
    console.log('CORS-enabled web server listening on port 80')
})


