const fs = require('fs'); 
const path = require('path'); 
const User = require("../model/user");
const Category = require("../model/category"); 

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

    const findDuplicateNameAndEmail = (ID, username, email) => {
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
    const findDuplicateCategory = async (name) => {
        const result = await Category.find({ name: name })
        if(result)
            return { param: "category", msg: "This category already exists." }
        else
            return null; 
    }

    const checkIfArrayHasEmptyValues = arr => {
        try {
            arr.forEach(item => {
                if (item.trim() == "")
                    return false;
            })
            return true;
        } catch (e) {
            console.log("Error with the function checkIfArrayHasEmptyValues. Variable arr: ", arr)
        }
    }

    return {
        BufferImage,
        TestFunction,
        findDuplicateNameAndEmail,
        findDuplicateCategory,
        checkIfArrayHasEmptyValues 
    }
}

module.exports = dataHooks; 