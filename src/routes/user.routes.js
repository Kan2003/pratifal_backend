import { Router } from "express";
import {
  loginUser,
  logoutUser,
  ragisterUser,
  refreshAccessToken,
  updatePassword,
  updateProfile,
  updateUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/ragister").post(upload.single("profile"), ragisterUser);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJwt, logoutUser);

router
  .route("/update-profile")
  .patch(verifyJwt, upload.single("profile"), updateProfile);

router.route("/update-details").patch(verifyJwt, updateUser);
router.route("/refresh-accesstoken").post(refreshAccessToken);
router.route("/update-password").patch(verifyJwt, updatePassword);

export default router;
