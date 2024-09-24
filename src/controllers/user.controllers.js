import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage, uploadImage } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const genrateAccessToken = async (id) => {
  try {
    const user = await User.findById(id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating access & refresh token");
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(401, "user not found");
  }

  const valid = await user.isPasswordCorrect(password);

  if (!valid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await genrateAccessToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User loggout successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const newProfileLocalPath = req.file.path;

  if (!newProfileLocalPath) {
    throw new ApiError(400, "Please provide a new profile image");
  }
  const newProfile = await uploadImage(newProfileLocalPath);

  const oldProfile = req.user.profile;

  //   console.log('oldprofile ' , oldProfile);

  await deleteImage(oldProfile);

  if (!newProfile) {
    throw new ApiError(400, "Failed to upload profile image");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { profile: newProfile.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { username, fullname } = req.body;

  const user = await User.findOne(req.user._id);

  if (user.username === username) {
    throw new ApiError(400, "Username already exists try another one");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { username, fullname },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User details"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "refresh is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await genrateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            newRefreshToken,
          },
          "User refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const updatePassword = asyncHandler(async (req , res) => {
    const {currentPassword , newPassword , reTypeNewPassword} = req.body;

    if(!(currentPassword && newPassword && reTypeNewPassword)){
        throw new ApiError(400, "All fields are required");
    }

    if(newPassword !== reTypeNewPassword){
        throw new ApiError(400, "New password and retyped password do not match");
    }

    const user = await User.findById(req.user._id);

    const valid = await user.isPasswordCorrect(currentPassword);

    if(!valid){
        throw new ApiError(401, "Invalid current password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(new ApiResponse(200, user, "Password changed successfully"));
})

export {
  ragisterUser,
  loginUser,
  logoutUser,
  updateProfile,
  updateUser,
  getCurrentUser,
  refreshAccessToken,
  updatePassword
};
