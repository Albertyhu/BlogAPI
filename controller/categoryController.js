const Category = require('../model/category.js'); 
const {body, validationResult } = require("express-validator")
const dataHooks = require("../util/dataHooks.js");
const he = require("he");
const fs = require('fs');
const path = require("path");
const {
    BufferImage,
    BufferArrayOfImages,
} = require("../util/imageHooks.js");

const { findDuplicateCategory } = dataHooks(); 

exports.CategoryList = async (req, res, next) => {
    await Category.find({})
        .sort({ name: 1 })
        .then(categories => {
            return res.status(200).json({categories})
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
    body("administrator"),
    async (req, res) => {
        const { name, description} = req.body; 
        var errors = validationResult(req); 

        var duplicateError = await findDuplicateCategory(name, null); 
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
                name: name ? he.decode(name) : "", 
                description: description.trim() ? he.decode(description.trim()) : "", 
                dateCreated: Date.now(),
                administrator: [req.body.administrator], 
            }

            if (req.file) {
                obj.image = await BufferImage(req.file)
            }
            const newCategory = new Category(obj);
            await newCategory.save()
                .then(result => {
                    console.log("The category is successfully created.")
                    res.status(200).json({newCategory: result, message: `The category is successfully created.`})
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

exports.GetOneCategoryByName = (req, res, next) => {
    Category.findOne({ name: req.params.name })
        .then(result => {
            return res.status(200).json({ category: result})
        })
        .catch(e => {
            res.status(404).json({ error: [{ param: "Category is not found", msg: e }] })
        })
}

exports.EditCategory = [
    body("name")
        .trim() 
        .isLength({ min: 1 })
        .withMessage("The name of the category cannot be empty.")
        .escape(), 
    body("description")
        .trim()
        .isLength({ max: 125 })
        .withMessage("The description cannot exceed over 125 characters.")
        .escape(),
    async (req, res) => {
        const { name, description } = req.body;
        var errors = validationResult(req);

        var duplicateError = await findDuplicateCategory(name, req.params.id);
        if (duplicateError != null) {
            errors.errors.push(duplicateError)
        }
        console.log("errors: ", errors)
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() })
        }
        try {
            var categoryImage = null;
            var obj = {
                name: name ? he.decode(name) : "",
                description: description.trim() ? he.decode(description.trim()) : "",
                dateCreated: Date.now(),
                _id: req.params.id,
            }
            if (req.file) {
                obj.image = await BufferImage(req.file)
            }
            await Category.findByIdAndUpdate(req.params.id, obj, {new: true})
                .then(result => {
                    console.log(`The category ${name} is successfully updated.`)
                    res.status(200).json({ updatedCategory: result, message: `The category is successfully created.` })
                })
                .catch(e => {
                    console.log("Error in updating the category: ", e)
                    res.status(500).json({ error: [{ param: "server", msg: `There was an error in updating the category. ${e}` }] })
                })

        } catch (e) {
            console.log("Error in updating the category: ", e)
            res.status(500).json({ error: [{ param: "server", msg: `There was an error in updating the category. ${e}` }] })
        }
    }
]

exports.DeleteCategory = async (req, res, next) => {
    const deletedCategory = req.params.id; 
    await Category.deleteOne({ _id: req.params.id })
        .then((response) => {
            console.log("Category is successfully deleted")
            res.status(200).json({ deletedCategory: deletedCategory, message: `Category ${deletedCategory} has been successfully deleted` })
        })
        .catch(e => {
            res.status(404).json({ error: [{ param: "Category is not found", msg: e }] })
        })
}

exports.GetPaginatedCategories = async (req, res, next) => {
    const error = [];
    var COUNT
    var PAGINATION
    try {
        COUNT = parseInt(req.params.count);
        PAGINATION = parseInt(req.params.page)
    } catch (e) {
        error.push(e)
    }
    if (!Number.isInteger(COUNT) || !Number.isInteger(PAGINATION) || COUNT <= 0 || PAGINATION < 0) {
        error.push('Invalid count or pagination value');
    }
    if (error.length > 0) {
        console.log("GetPaginatedCategories error: ", error)
        return res.status(400).json({ error })
    }
    const start = PAGINATION * COUNT;
    await Category.find({})
        .skip(start)
        .limit(COUNT)
        .sort({"name": 1})
        .then(paginatedResult => {
            console.log("Successfully retrieved paginated categories.")
            return res.status(200).json({ paginatedResult })
        })
        .catch(error => {
            console.log("GetPaginatedCategoriest error: ", error)
            return res.status(500).json({ error })
        })
}