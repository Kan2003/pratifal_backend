import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Reward } from "../models/rewards.model.js";
import { User } from "../models/user.model.js";

const createReward = asyncHandler(async (req, res) => {
  console.log("enetr");
  try {
    const { title, description, couponCode, expiryDate } = req.body;

    if (!(title && description && couponCode && expiryDate)) {
      throw new ApiError(400, "All fields are required");
    }

    console.log(title, description, couponCode, expiryDate);
    const existed = await Reward.findOne({
      couponCode,
    });
    console.log(existed);

    if (existed) {
      return res.status(401).json(new ApiResponse(401, "coupon alerday exist"));
    }
    const reward = await Reward.create({
      title,
      description,
      couponCode,
      expiryDate: new Date(expiryDate),
      owner: req.user._id,
    });

    await User.findOneAndUpdate(
      req.user._id,
      {
        $push: { rewards: reward._id },
      },
      { new: true }
    );

    return res
      .status(201)
      .json(new ApiResponse(201, "reward created successfully"));
  } catch (error) {
    throw new ApiError(500, "error on creating reward", error);
  }
});



export { createReward };
