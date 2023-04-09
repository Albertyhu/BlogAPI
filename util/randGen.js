const { ObjectId } = require('mongodb');

//MongoDb doesn't except uppercase letters in its objectId's
const alpha = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

//exports.genKey = (size) => {
//    var key = "";
//    for (var i = 0; i < size; i++) {
//        key += alpha[Math.floor(Math.random() * alpha.length)];
//    }
//    return key;
//}


exports.genKey = (size) => {
    const hexString = [...Array(size)].map(() => (Math.floor(Math.random() * 16)).toString(16)).join('');
    return new ObjectId(hexString);
};

exports.pickFromArray = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
}


exports.pickCategoryId = (list) => {
    var picked = list[Math.floor(Math.random() * list.length)];
    return picked._id; 
}