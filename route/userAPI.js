const express = require('express');
const router = express.Router();
const cors = require('cors');
const UserController = require('../controller/userController.js');
const postController = require('../controller/postController.js');
const { verifyToken, checkAdmin } = require("../middleware/verifyMember.js");
const { upload } = require("../middleware/multerSetup.js");
const UserPhotoController = require("../controller/userPhotoController.js")

router.get('/', cors(), UserController.GetAllUsers)

router.get('/usernameandemail', cors(), UserController.GetUsernameAndEmails)

router.get('/:authorId/posts', cors(), postController.AllPostsByAuthor);

router.get('/:authorId/posts/:postId', cors(), postController.GetOnePostByAuthor)

router.get('/:id', cors(), UserController.GetUser)

router.get('/:id/get_current_user_and_categories', cors(), verifyToken, UserController.GetCurrentUserAndCategories)

router.get('/:id/profilepicture', cors(), UserController.GetUserProfilePicture)

router.get("/:id/user_photos", cors(), UserPhotoController.GetUserPhotos)

router.put('/:id/upload_photos', cors(), verifyToken, upload.array("images"), UserPhotoController.UploadPhotos)

router.put("/:id/delete_photos", cors(), verifyToken, upload.none(), UserPhotoController.DeleteManyPhotos)

router.put('/:id/editpassword', cors(), verifyToken, upload.none(), UserController.ChangePassword)

router.put('/:id/uploadnewpicture', cors(), verifyToken, upload.single("profile_pic"), UserController.UploadNewProfilePicture)

router.put('/:id/update_user_profile', cors(), verifyToken, upload.single("profile_pic"), UserController.UpdateUserProfile)

router.delete('/:id/delete', cors(), UserController.DeleteUser)

router.delete('/:id/delete_with_password', cors(), UserController.DeleteUserWithPassword)

router.get("/:id/fetch_user", cors(), UserController.GetUserByName)

module.exports = router;     