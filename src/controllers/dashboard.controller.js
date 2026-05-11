import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ============================================================
// 📊 CHANNEL STATS (FINAL OPTIMIZED VERSION)
// ============================================================
export const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id

    if (!channelId) {
        throw new ApiError(400, "Channel not found")
    }

    const channelObjectId = new mongoose.Types.ObjectId(channelId)

    // ========================================================
    // 🎥 VIDEO STATS
    // ========================================================
    const videoStats = await Video.aggregate([
        {
            $match: { owner: channelObjectId }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    // ========================================================
    // 👥 SUBSCRIBERS
    // ========================================================
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelObjectId
    })

    // ========================================================
    // ❤️ LIKES (FIXED - NO LOOKUP VERSION)
    // ========================================================

    const videoIds = await Video.find({
        owner: channelObjectId
    }).distinct("_id")

    const totalLikes = await Like.countDocuments({
        targetType: "video",
        targetId: { $in: videoIds }
    })

    // ========================================================
    // 📦 RESPONSE
    // ========================================================
    const stats = {
        totalVideos: videoStats?.[0]?.totalVideos || 0,
        totalViews: videoStats?.[0]?.totalViews || 0,
        totalSubscribers: totalSubscribers || 0,
        totalLikes: totalLikes || 0
    }

    return res.status(200).json(
        new ApiResponse(200, stats, "Channel stats fetched successfully")
    )
})

// ============================================================
// 🎬 CHANNEL VIDEOS
// ============================================================
export const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id

    if (!channelId) {
        throw new ApiError(400, "Channel not found")
    }

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .select("title thumbnail views createdAt duration")

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    )
})