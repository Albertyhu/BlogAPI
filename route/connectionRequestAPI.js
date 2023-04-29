const express = require('express');
const router = express.Router();
const cors = require('cors');
const UserController = require('../controller/userController.js');
const postController = require('../controller/postController.js');
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js");
const { upload } = require("../middleware/multerSetup.js");

router.put("/:id/handle_connection_request", cors(), verifyToken, UserController.HandleConnectionRequest)

module.exports = reouter; 