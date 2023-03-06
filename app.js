const express = require('express')
const path = require('path'); 
const mongoose = require('mongoose'); 
var bodyParser = require('body-parser');
const app = express(); 

app.set('views', __dirname + '/views'); 
app.set('view engine', "EJS"); 

const mainRoute = require('./route/mainRoute.js'); 

app.use('/', mainRoute); 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

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

app.listen(3000, () => console.log("app listening on port 3000!"));