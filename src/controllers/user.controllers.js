import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImage } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const ragisterUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  console.log("body", req.body);
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "Username or email already exists");
  }

  
  let profileLocal;
  if (req.file) {
    profileLocal = req.file?.path;
  }

  const profileUpload = await uploadImage(profileLocal);


  const user = await User.create({
    username,
    fullname,
    email,
    password,
    profile: profileUpload?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", createdUser));
});

export { ragisterUser };
