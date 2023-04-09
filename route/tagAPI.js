const express = require('express');
const router = express.Router();
const cors = require('cors');
const { upload } = require("../middleware/multerSetup.js");
const tagController = require('../controller/tagController.js');

const { verifyToken} = require("../middleware/verifyMember.js"); 

router.get("/", cors(), tagController.GetAllTags); 

router.get("/get_single_tag", cors(),  tagController.GetOneTag); 

router.post("/create", cors(), verifyToken, upload.none(), tagController.CreateManyTags);

router.post("/create2", cors(), verifyToken, upload.none(), tagController.CreateManyTagsWithoutDuplicates);

router.delete("/delete_tags", cors(), verifyToken, tagController.DeleteTags); 

module.exports = router;   