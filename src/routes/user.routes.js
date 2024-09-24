import { Router } from "express";
import { ragisterUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();


router.route('/ragister').post(upload.single("profile") , ragisterUser)


export default router;