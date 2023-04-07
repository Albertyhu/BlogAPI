
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


const post = [
    {
        "title": "10 Healthy Breakfast Ideas",
        "content": "Are you tired of the same old breakfast routine? Here are 10 healthy and delicious breakfast ideas to try out!",
        "published": true,
        "datePublished": "2022-03-07T00:00:00.000Z" ,
        "author": "640679c46edb54e6d6e34c38" ,
        "abstract": "Here are some healthy breakfast ideas to jumpstart your day!",
        "category": new ObjectId("642a9b8fbfbc753224bb3ecd"),
        "tag": [],
        "comments": [],
        "likes": []
    },
]


module.exports = post; 