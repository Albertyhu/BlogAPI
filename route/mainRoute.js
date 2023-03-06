const express = require('express');
const router = express.Router(); 

router.get('/', (req, res) => {
    res.render('index', {
        user: req.user,
        title: "Home",
        burgerMenu: "/assets/icon/hamburger_menu_white.png",
    })
}); 

router.get('/register', (req, res) => {
    res.render('authentication/register', {title: "Create a new account"})
})

module.exports = router; 