const express = require('express');
const router = express.Router();
const cors = require('cors');
const categoryController = require('../controller/categoryController.js');
const postController = require('../controller/postController.js');

const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js"); 
const { upload } = require("../middleware/multerSetup.js");

router.get("/", cors(), categoryController.CategoryList);

router.post("/create", cors(), verifyToken, upload.single("image"), categoryController.CreateCategory);

router.get("/:id", cors(), categoryController.FindOneCategory)

router.put("/:id/edit", cors(), verifyToken, upload.single("image"), categoryController.EditCategory);

router.delete("/:id/delete", cors(), verifyToken, categoryController.DeleteCategory); 

router.get("/:name", cors(), categoryController.GetOneCategoryByName)

module.exports = router;  