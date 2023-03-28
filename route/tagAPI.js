const express = require('express');
const router = express.Router();
const cors = require('cors');
const tagController = require('../controller/tagController.js');
const path = require('path');
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js"); 

router.get("/", cors(), tagController.GetAllTags); 

router.get("/get_single_tag", cors(),  tagController.GetOneTag); 

router.post("/create", cors(), verifyToken, tagController.CreateManyTags); 

router.delete("/delete_tags", cors(), verifyToken, tagController.DeleteTags); 

module.exports = router; 