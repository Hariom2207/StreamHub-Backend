import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleLikeHandler = async ({ targetType, targetId, userId }) => {
    const filter = {
        likedby: userId,
        targetType,
        targetId,
    };

    //  atomic toggle
    const deletedLike = await Like.findOneAndDelete(filter);

    let isLiked;

    if (deletedLike) {
        isLiked = false;
    } else {
        await Like.create(filter);
        isLiked = true;
    }

    //  count likes
    const likesCount = await Like.countDocuments({
        targetType,
        targetId,
    });

    return { isLiked, likesCount };
};


export const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const result = await toggleLikeHandler({
        targetType: "video",
        targetId: videoId,
        userId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Video like toggled"));
});


export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const result = await toggleLikeHandler({
        targetType: "comment",
        targetId: commentId,
        userId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment like toggled"));
});



export const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const result = await toggleLikeHandler({
        targetType: "tweet",
        targetId: tweetId,
        userId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Tweet like toggled"));
});



export const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id

  if (!userId) {
    throw new ApiError(401, "Unauthorized request")
  }

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedby: userId,
        targetType: "video",
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "targetId",
        foreignField: "_id",
        as: "video",
      },
    },

    { $unwind: "$video" },

    {
      $lookup: {
        from: "users",
        localField: "video.owner",
        foreignField: "_id",
        as: "owner",
      },
    },

    { $unwind: "$owner" },

    {
      $project: {
        _id: "$video._id",
        title: "$video.title",
        thumbnailUrl: "$video.thumbnailUrl",
        views: "$video.views",
        createdAt: "$video.createdAt",
        likedAt: "$createdAt",
        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar",
        },
      },
    },

    { $sort: { likedAt: -1 } },
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      likedVideos,
      "Liked videos fetched successfully"
    )
  )

});