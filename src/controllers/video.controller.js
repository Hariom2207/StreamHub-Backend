import mongoose from "mongoose";
const { isValidObjectId } = mongoose;

import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";


// ================= GET ALL VIDEOS =================
const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (page < 1 || limit < 1) {
    throw new ApiError(400, "Invalid pagination values");
  }

  const filter = {};

  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }

  if (userId && isValidObjectId(userId)) {
    filter.owner = userId;
  }

  const sort = { [sortBy]: sortType === "asc" ? 1 : -1 };

  const videos = await Video.find(filter)
    .populate("owner", "username avatar fullName")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const videoIds = videos.map((v) => v._id);

  const likesAgg = await Like.aggregate([
    {
      $match: {
        targetType: "video",
        targetId: { $in: videoIds },
      },
    },
    {
      $group: {
        _id: "$targetId",
        count: { $sum: 1 },
      },
    },
  ]);

  const likesMap = {};
  likesAgg.forEach((l) => {
    likesMap[l._id.toString()] = l.count;
  });

  const enrichedVideos = videos.map((v) => ({
    ...v,
    likesCount: likesMap[v._id.toString()] || 0,
  }));

  const total = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      videos: enrichedVideos,
      total,
      page,
      limit,
    }, "Videos fetched successfully")
  );
});


// ================= GET VIDEO BY ID =================
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;


  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).lean();

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const userId = req.user?._id
    ? new mongoose.Types.ObjectId(req.user._id)
    : null;

  // OWNER with subscribersCount
  const ownerData = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(video.owner),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
      },
    },
  ]);

  const owner = ownerData[0] || {
    fullName: "",
    username: "",
    avatar: "",
    subscribersCount: 0,
    isSubscribed: false,
  };

  // ✅ FIXED — ObjectId properly convert kiya
  let isSubscribed = false;
  if (userId) {
    isSubscribed = await Subscription.exists({
      channel: new mongoose.Types.ObjectId(video.owner),  // ← FIX
      subscriber: userId,
    });
  }

  owner.isSubscribed = !!isSubscribed;

  // LIKES
  const [likesCount, userLike] = await Promise.all([
    Like.countDocuments({ targetType: "video", targetId: videoId }),
    userId
      ? Like.findOne({
          targetType: "video",
          targetId: videoId,
          likedby: userId,
        }).lean()
      : null,
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      ...video,
      owner,
      likesCount,
      isLiked: !!userLike,
    }, "Video fetched successfully")
  );
});


// ================= INCREMENT VIDEO VIEWS =================
const incrementVideoViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "View counted")
  );
});


// ================= PUBLISH VIDEO =================
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFile = req.files?.video?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(400, "Video & thumbnail required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoFile.path, "video");
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path, "image");

  const video = await Video.create({
    videofile: uploadedVideo.secure_url,
    thumbnail: uploadedThumbnail.secure_url,
    duration: uploadedVideo.duration || 0,
    title,
    description,
    owner: req.user._id,
    isPublished: true,
  });

  return res.status(201).json(
    new ApiResponse(201, video, "Video published")
  );
});


// ================= UPDATE VIDEO =================
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  const { title, description } = req.body;

  let thumbnailUrl;
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path, "image");
    thumbnailUrl = uploaded?.secure_url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title || video.title,
        description: description || video.description,
        ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
      },
    },
    { new: true }
  ).lean();

  return res.status(200).json(
    new ApiResponse(200, updatedVideo, "Video updated")
  );
});


// ================= DELETE VIDEO =================
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  await Promise.all([
    video.videofile && deleteFromCloudinary(video.videofile, "video"),
    video.thumbnail && deleteFromCloudinary(video.thumbnail, "image"),
  ]);

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new ApiResponse(200, {}, "Video deleted")
  );
});


// ================= TOGGLE PUBLISH =================
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Publish status updated")
  );
});


// ================= EXPORT =================
export {
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  incrementVideoViews,
};