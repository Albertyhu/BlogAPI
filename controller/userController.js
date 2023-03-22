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

exports.GetUserProfilePicture = async (req, res, next) => {
    try {
        await User.findById(req.params.id)
            .then(result => {
                if (!result) {
                    return res.status(404).json({message: "User is not found"})
                }
                if (!result.profile_pic) {
                    return res.status(404).json({messaage: "The user's profile picture does not exist."})
                }
                return res.status(200).json({message: "Profile picture found", profile_pic: result.profile_pic})
            })
    }
    catch (e) {
        return res.status(500).json({ error: [{ param: "server", msg: "Internal service error: " + e }] })

    }
}

exports.GetUsernameAndEmails = async (req, res, next) => {
    try {
        const result = await User.find({})
            .sort({ username: 1 })
            .exec(); 
        var data = []
        result.forEach(person => {
            data.push({
                username: person.username, 
                email: person.email,
            })
        })
        res.status(200).json(data)
    } catch (e) {
        return res.status(404).json({ message: "No users." })
    }
}

exports.UpdateUser = async (req, res, next) => {
    
}


exports.DeleteUser = async (req, res, next) => {
    console.log("Deleting user")
    await User.deleteOne({ _id: req.params.id })
        .then(result => {
            console.log("User has successfully been deleted.")
            res.status(200).json({ message: "User has been deleted" });
        })
        .catch(e => {
            console.log("Error in deleting user: ", e)
            res.status(500).json({ message: "Internal service error", error: e.message });
        })

}

