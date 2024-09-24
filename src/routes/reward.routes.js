import { Router } from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import { createReward } from "../controllers/reward.controllers.js";



const router = Router()



router.route('/create-reward').post(verifyJwt , createReward)


export default router;