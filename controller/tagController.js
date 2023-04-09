const Tag = require('../model/tag'); 
const { body, validationResult } = require('express-validator'); 
const he = require("he")
const dataHooks = require('../util/dataHooks.js'); 
const { ObjectId } = require('mongodb');
const { genKey } = require('../util/randGen.js'); 

const { checkIfArrayHasEmptyValues } = dataHooks(); 

exports.GetAllTags = async (req, res, next) => {
    await Tag.find({})
        .sort({ name: 1 })
        .then(result => {
            return res.status(200).json({ payload: result, message: "All tags retrieved" })
        })
        .catch(e => {
            return res.status(500).json({ error: [{ param: "server", msg: `Internal server error - ${e}` }]})
        })
}

exports.GetOneTag = async (req, res, next) => {
    await Tag.find({ name: req.body.tagname })
        .then(result => {
            return res.status(200).json({ payload: result, message: "All tags retrieved" })
        }).catch(e => {
            return res.status(500).json({ error: [{ param: "server", msg: `Internal server error - ${e}` }] })
        })
}

exports.CreateTag = async (req, res, next) => {
    if (he.decode(req.body.name.trim()) != "") {
        const newTag = new Tag({ name: he.decode(req.body.name) });
        await newTag.save()
            .then(result => {
                return res.status(200).json({ message: `The tag ${result.name} has been created.` });
            }).catch(e => {
                return res.status(500).json({ error: [{ param: "server", msg: `Internal server error - ${e}` }] })
            })
    }
    else {
        return res.status(404).json({ error: [{ param: "name", msg: "You must indicate the name of your tag."}] })
    }
}

//This function assumes that all values in the array that is retrieved from the client are not empty
exports.CreateManyTags = async (req, res, next) => {
    var tagsList;
    try {
        tagsList = JSON.parse(req.body.tags) 
        if (typeof tagsList != 'undefined' && tagsList.length > 0) {
            if (checkIfArrayHasEmptyValues(tagsList, "name")) {
                await Tag.insertMany(tagsList)
                    .then(result => {
                        res.status(200).json({ message: "Tags are successfully saved." })
                    })
                    .catch(e => {
                        res.status(404).json({ error: [{ param: "server", msg: `There was an error in saving the tags - ${e}` }] })
                    })
            } else { 
                res.status(404).json({ error: [{ param: "general", msg: "Tags cannot be empty." }] })
            }
        }
        else {
            res.status(400).json({ error: [{param: "general", msg: "There are no tags to be saved to the database."}]})
            }  
    }
    catch (e) {
        console.log("Error in parsing data", e)
        res.status(400).json({ error: [{ param: "server", msg: `${e}` }] })

    }
}  

//Preliminaries: In order for it to work, this function requires that the client has included ObjectId's of the existing tags in
//...the tagList argument
exports.CreateManyTagsWithoutDuplicates = async (req, res, next) => {
    try {
        var tagList = JSON.parse(req.body.tags); 

        const result = await retrieveTagId(tagList)
        console.log("CreateNewTagsAndReturn result: ", result)
        res.status(200).json({ tags: result })

    } catch (e) {
        console.log("CreateManyTagsWithoutDuplicates error - last catch :", e)
        res.status(400).json({ error: [{ param: "server", msg: `${e}` }] })
    }
} 

//This function serves to complete the create post function, which has to determine if the user's inputted tags are either new or old
//newTags is an array 
const CreateNewTagsAndReturn = async (newTags) => {
    try {
        if (newTags != null && newTags.length > 0) {
            await Tag.insertMany(newTags)
                .then(result => {
                    //will result contain the id's of new tags? 
                    return result; 
                })
                .catch(e => {
                    console.log("There is an error after creating new tags in function CreateNewTagsAndReturn: ", e)
                })
        }
    } catch (e) {
        console.log("Error in CreateNewTagsAndReturn: ", e)
    }
}

//This function is a complement to creating a new post
//Preliminaries: In order for it to work, this function requires that the client has included ObjectId's of the existing tags in 
//...the tagList argument
const retrieveTagId = async (tagList, postID) => {
    try {
        if (tagList != null && tagList.length > 0) {
            //const existingTags = await Tag.find({})
            const existingTags = tagList.filter(item => item._id != null && typeof item._id != 'undefined')

            //gather all Object Id's of the existing tags into an array
            var existingIdArray = [];
            existingTags.forEach(item => { existingIdArray.push(item._id) })
            //sort out the rest of the tags that don't have Object ID's. These are the new tags that will be created
            var nonexisting = tagList.filter(item => item._id == null || typeof item._id == 'undefined')
            //generate ID's for the new tags 
            var newIdArray =[]

            nonexisting.forEach(item => {
                const ID = genKey(12); 
                newIdArray.push(ID.toString()); 
                item._id = ID; 
                item.post = [postID]
            })
            
            //create and save the new tags into the database
            var newTags = await CreateNewTagsAndReturn(nonexisting); 
            //combine the existing tags and new tags together 
            return newIdArray.concat(existingIdArray)
        }
        else {
            console.log("SaveTagsToPost Error: parameter is empty")
        }
    } catch (e) {
        console.log("There is an error with SaveTagsToPost: ", e)
    }
}

//Preliminaries: Argument for tagList is already parsed 
exports.saveTagsFromNewPost = async (tagList, post) => {
    try {
        const operations = tagList.map(opt =>
        {
            return {
                updateOne: {
                    filter: { name: opt.name },
                    update: {
                        $addToSet: { post: post._id}
                    },
                    upsert: true, 
                }
            }
        })
        const result = await Tag.bulkWrite(operations)
                console.log("The following tags are successfully updated: ", result)
                const savedTagArray = []; 
                const upsertedIds = result.upsertedIds
                for (var i in upsertedIds) {
                    savedTagArray.push(upsertedIds[i])
                }

                console.log("savedTagArray: ", savedTagArray)
                return savedTagArray; 
    } catch (e) {
        console.log("There is an error with saveTagsFromNewPost: ", e)
    }
}
 
exports.DeleteTags = [
    body("taglist"),
    async (req, res, next) => {
        if (req.body.taglist.length > 0) {
            await Tag.deleteMany({ name: { $in: req.body.taglist }})
                .then(result => {
                    console.log(`Tags have been deleted`)
                    return res.status(200).json({ message: `Tags have been deleted` })
                })
                .catch(e => {
                    return res.status(500).json({ error: [{ param: "server", msg: `Internal server error - ${e}` }] })
                })
        }
        else {
            return res.status(404).json({ error: [{ param: "general", msg: `There's nothing to delete` }] }); 
        }
    }
]
