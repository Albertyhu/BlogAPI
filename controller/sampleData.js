const SampleUsers = require('../sampleData/sampleUsers.js'); 
const async = require('async'); 
const mongoose = require('mongoose');
const User = require('../model/user.js'); 

const PopulateUsers = data => {
    data.forEach( async person => {
        const newUser = new User(person);
        const result = await newUser.save();
        console.log("result: ", result) 
    })
}


exports.populate = (req, res, next) => {
    async.parallel([
        () => {PopulateUsers(SampleUsers)}
    ],
        function (err, results) {
            if (err) {
                console.log("FINAL ERR: " + err);
            } else {
                console.log("Database is successfully populated");
            } 
            mongoose.connection.close(); 
        }
    )
} 