const express = require('express');
const router = express.Router();
const cors = require('cors');
const { upload } = require('../middleware/multerSetup.js');
const { verifyToken } = require('../middleware/verifyMember.js')
const commentController = require('../controller/commentController.js'); 

router.get("/get_search_data", cors(), commentController.GetCommentSearchData)

router.put("/:id/updateLike", cors(), verifyToken, commentController.UpdateLikes)

router.put('/:id/add_like', cors(), verifyToken, upload.none(), commentController.AddToLikes);

router.put('/:id/remove_like', cors(), verifyToken, upload.none(), commentController.RemoveLikes)

router.post("/:id/add_reply", cors(), verifyToken, upload.array("images"), commentController.AddReplyToComment)

router.put("/:id/edit", cors(), verifyToken, upload.array("images"), commentController.EditComment)

router.delete('/:id/delete_completely', cors(), verifyToken, upload.none(), commentController.DeleteCompletely)

module.exports = router; 