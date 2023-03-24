const fs = require('fs'); 
const path = require('path'); 
const User = require("../model/user");

const dataHooks = () => {
    const BufferImage = (File) => {
        return {
            data: fs.readFileSync(path.join(__dirname, '../public/uploads/', File.filename)),
            contentType: File.mimetype,
        }
    }

    const TestFunction = () => {
        console.log("This works")
        return "This works"; 
    }

    const findDuplicates = (ID, username, email) => {
        var Errors = []
        User.find({})
            .then(list => {
                list.forEach(user => {
                    if (user.email.toLowerCase().trim() == email.toLowerCase().trim()) {
                        if (user._id != ID) {
                            Errors.push({
                                params: "email",
                                msg: "Another user is already using that email."
                            })
                        }
                    }
                    if (user.username.trim() == username.trim()) {
                        if (user._id != ID) {
                            Errors.push({
                                params: "username",
                                msg: "Another user is already using that username."
                            })
                        }
                    }
                })
            })
        return Errors; 
    }

    return {
        BufferImage,
        TestFunction,
        findDuplicates
    }
}

module.exports = dataHooks; 