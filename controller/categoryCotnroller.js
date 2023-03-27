const Category = require('../model/category.js'); 
const {body, validationResult } = require("express-validator")

exports.CategoryList = (req, res, next) => {
    Category.find({})
        .sort({name: 1})
        .then(response => {
            res.status(200).json({ categories: response })
        })
        .catch(e => {
            res.status(404).json({ error: [{param: "Category is not found", msg: e}]})
        })
}

exports.FindOneCategory = (req, res, next) => {
    Category.findById(req.params.id)
        .then(response => {
            res.status(200).json({ category: response })
        })
        .catch(e => {
            res.status(404).json({ error: [{ param: "Category is not found", msg: e }] })
        })
}

exports.CreateCategory = [
    
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