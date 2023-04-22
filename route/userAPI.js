const express = require('express');
const router = express.Router();
const cors = require('cors');
const UserController = require('../controller/userController.js');
const postController = require('../controller/postController.js');
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js");
const { upload } = require("../middleware/multerSetup.js");

router.get('/', cors(), UserController.GetAllUsers)

router.get('/usernameandemail', cors(), UserController.GetUsernameAndEmails)

router.get('/:authorId/posts', cors(), postController.AllPostsByAuthor);

router.get('/:authorId/posts/:postId', cors(), postController.GetOnePostByAuthor)

router.get('/:id', cors(), UserController.GetUser)

router.get('/:id/profilepicture', cors(), UserController.GetUserProfilePicture)

router.post('/:id/upload_photos', cors(), verifyToken, upload.array("images"), UserController.UploadPhotos)

router.delete("/:id/delete_photos", cors(), verifyToken, UserController.DeleteManyPhotos)

router.put('/:id/editpassword', cors(), verifyToken, upload.none(), UserController.ChangePassword)

router.put('/:id/uploadnewpicture', cors(), verifyToken, upload.single("profile_pic"), UserController.UploadNewProfilePicture)

router.put('/:id/update_user_profile', cors(), verifyToken, upload.single("profile_pic"), UserController.UpdateUserProfile)

router.delete('/:id/delete', cors(), UserController.DeleteUser)

module.exports = router;     