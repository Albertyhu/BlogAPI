const Tag = require('../model/tag'); 
const { body, validationResult } = require('express-validator'); 
const he = require("he")
const dataHooks = require('../util/dataHooks.js'); 

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