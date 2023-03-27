const express = require('express');
const router = express.Router();
const cors = require('cors');
const categoryController = require('../controller/categoryCotnroller.js');
const postController = require('../controller/postController.js');
const path = require('path')
const multer = require('multer');
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js"); 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${file.filename}${ext}`;
        cb(null, filename)
    },
});


const upload = multer({
    limits: { fileSize: 1024 * 1024 * 5 },
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
    }
}); 


router.get("/", cors(), categoryController.CategoryList);

router.post("/create", cors(), verifyToken, upload.single(), categoryController.CreateCategory);

router.get("/:id", cors(), categoryController.FindOneCategory)

router.post("/:id/edit", cors(), verifyToken, upload.single(), categoryController.EditCategory);

router.delete("/:id/delete", cors(), verifyToken, categoryController.DeleteCategory); 

module.exports = router; 