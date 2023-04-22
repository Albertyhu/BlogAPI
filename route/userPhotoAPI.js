const express = require('express');
const router = express.Router();
const cors = require('cors');
const { upload } = require('../middleware/multerSetup.js');
const { verifyToken } = require('../middleware/verifyMember.js')
const UserPhotoController = require("../controller/userPhotoController.js");
const UserController = require("../controller/userController.js"); 

router.post("/:id/add_comment", cors(), verifyToken, upload.array("images"), UserPhotoController.AddComment)

router.put("/:id/edit", cors(), verifyToken, upload.none(), UserPhotoController.UpdatePhoto); 

router.put("/:id/add_like", cors(), verifyToken, upload.none(), UserPhotoController.AddLike); 

router.put("/:id/remove_like", cors(), verifyToken, upload.none(), UserPhotoController.RemoveLike);

router.delete("/:id/delete", cors(), verifyToken, upload.none(), UserPhotoController.DeletePhoto); 

module.exports = router; 