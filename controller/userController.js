const User = require('../model/user.js'); 
const SampleUsers = require('../sampleData/sampleUsers.js'); 


exports.GetAllUsers = async (req, res, next) => {
    try { 
        var result = await User.find({})
            .sort({ username: 1 })
            .exec();
        res.status(200).json(result)

    } catch (err){
        return res.status(404).json({ message: "No users." })
    }
}


/*Alternative way of writing GetAllUsers */
//exports.GetAllUsers = (req, res, next) => {
//    User.find({})
//        .sort({ username: 1 })
//        .exec()
//        .then((result) => {
//            console.log("result: ", result)
//            res.status(200).json(result)
//        })
//        .catch(err =>{
//            console.log("error getting users: ", err)
//            return res.status(404).json({ message: "No users." })
//        })
//}


exports.GetUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).exec()
        res.status(200).json(response)
    } catch (e) {
        return res.status(400).json({ message: "User is not found" })

    }
}

exports.UpdateUser = async (req, res, next) => {
    
}