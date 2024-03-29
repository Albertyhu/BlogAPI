const fs = require('fs'); 
const path = require('path'); 
const User = require("../model/user");
const Category = require("../model/category"); 

const dataHooks = () => {
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
    const findDuplicateCategory = async (name, ID) => {
        const result = await Category.find({})
        if (result.find(val => val.name == name && val._id.toString() != ID.toString())) {
            return { param: "name", msg: "This category already exists." }
        }
        else { 
            return null;

        }
    }

    const checkIfArrayHasEmptyValues = (arr, item )=> {
        try {
            arr.forEach(val => {
                if (val[`${item}`].trim() == "")
                    return false;
            })
            return true;
        } catch (e) {
            console.log("Error with the function checkIfArrayHasEmptyValues. Variable arr: ", e, arr)
        }
    }

    const RetrieveTagIDs = (tagList) => {
        var arr = []; 
        tagList.forEach(item => {
            if (typeof item._id != 'undefined' && item._id != null) {
                arr.push(item._id);
            }
        })
        return arr;
    }

    const AddToArray = (array, ) => { }

    return {
        TestFunction,
        findDuplicateNameAndEmail,
        findDuplicateCategory,
        checkIfArrayHasEmptyValues,
        RetrieveTagIDs
    }
}

module.exports = dataHooks; 