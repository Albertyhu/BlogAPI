const Category = require('../model/category.js'); 
const {body, validationResult } = require("express-validator")
const dataHooks = require("../util/dataHooks.js");
const he = require("he");
const fs = require('fs');
const path = require("path");

const { findDuplicateCategory } = dataHooks(); 

exports.CategoryList = (req, res, next) => {
    Category.find({})
        .sort({ name: 1 })
        .then(response => {
            res.status(200).json({ categories: response })
        })
        .catch(e => {
            res.status(404).json({ error: [{param: "Error in retriving list of categogy - ", msg: e}]})
        })
}

exports.FindOneCategory = (req, res, next) => {
    Category.findById(req.params.id)
        .populate("Post")
        .then(response => {
            res.status(200).json({ category: response })
        })
        .catch(e => {
            res.status(404).json({ error: [{ param: "Category is not found", msg: e }] })
        })
}

exports.CreateCategory = [
    body("name")
        .trim()
        .isLength({ min: 1 })
        .withMessage("You must type of the name of the new category")
        .escape(), 
    body("description")
        .trim()
        .isLength({ max: 125 })
        .withMessage("The description cannot exceed over 125 characters.")
        .escape(), 
    async (req, res) => {
        const { name, description} = req.body; 
        var errors = validationResult(req); 

        var duplicateError = await findDuplicateCategory(name); 
        if (duplicateError != null) {
            errors.errors.push(duplicateError)
        }
        console.log("errors: ", errors)
        if (!errors.isEmpty()) {
            return res.status(400).json({error: errors.array()})
        }
        try {
            var categoryImage = null; 
            var obj = {
                name: name ? he.decode(name.replace(/\s/g, '')) : "", 
                description: description.trim() ? he.decode(description.trim()) : "", 
                dateCreated: Date.now(),
            }
            if (req.file) {
                categoryImage = {
                    data: fs.readFileSync(path.join(__dirname, '../public/uploads/', req.file.filename)),
                    contentType: req.file.mimetype,
                }
                obj.image = categoryImage; 
            }
            const newCategory = new Category(obj);
            await newCategory.save()
                .then(result => {
                    console.log("The category is successfully created.")
                    res.status(200).json({message: `The category is successfully created.`})
                })
                .catch(e => {
                    console.log("Error in creating the category: ", e)
                    res.status(500).json({ error: [{param: "server", msg: `There was an error creating a new category. ${e}`}]})
                })

        } catch (e) {
            console.log("Error in creating the category: ", e)
            res.status(500).json({ error: [{ param: "server", msg: `There was an error creating a new category. ${e}` }] })
        }
    }
]

exports.EditCategory = []

exports.DeleteCategory = async (req, res, next) => {
    await Category.deleteONe({ _id: req.params.id })
        .then((response) => {
            console.log("Category is successfully deleted")
            res.status(200).json({ message:`Category ${response.name} has been successfully deleted` })
        })
        .catch(e => {
            res.status(404).json({ error: [{ param: "Category is not found", msg: e }] })
        })
}