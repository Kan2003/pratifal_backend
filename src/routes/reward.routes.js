import { Router } from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
  createReward,
  deleteReward,
  editReward,
  expiredRewards,
  getAllRewards,
  redeemedRewards,
  toggleRedeem,
  totalReward,
} from "../controllers/reward.controllers.js";

const router = Router();

router.route("/create-reward").post(verifyJwt, createReward);

router.route("/update-reward/:id").patch(verifyJwt, editReward);

router.route("/totals").get(verifyJwt, totalReward);

router.route("/delete-reward/:id").get(verifyJwt, deleteReward);

router.route("/toggle-redeem/:id").patch(verifyJwt, toggleRedeem);

router.route("/").get(verifyJwt, getAllRewards);

router.route("/redeemed").get(verifyJwt, redeemedRewards);

router.route("/expired-reward").get(verifyJwt, expiredRewards);

export default router;
