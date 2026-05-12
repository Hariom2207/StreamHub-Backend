import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// ================= TOGGLE SUBSCRIPTION (FIXED) =================
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // check subscription
    const existing = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    let isSubscribed;

    if (existing) {
        await Subscription.deleteOne({ _id: existing._id });
        isSubscribed = false;
    } else {
        await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });
        isSubscribed = true;
    }

    //  always send updated count
    const subscribersCount = await Subscription.countDocuments({
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isSubscribed,
                subscribersCount,
            },
            "Subscription updated successfully"
        )
    );
});


// ================= GET CHANNEL SUBSCRIBERS =================
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const skip = (page - 1) * limit;

    const subscribers = await Subscription.find({
        channel: channelId,
    })
        .populate("subscriber", "username email avatar")
        .skip(skip)
        .limit(Number(limit))
        .lean();

    const total = await Subscription.countDocuments({
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                total,
                page: Number(page),
                limit: Number(limit),
                subscribers,
            },
            "Subscribers fetched successfully"
        )
    );
});


// ================= GET SUBSCRIBED CHANNELS =================
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    if (subscriberId !== userId.toString()) {
        throw new ApiError(403, "Access denied");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
            },
        },
        { $unwind: "$channel" },
        {
            $lookup: {
                from: "subscriptions",
                localField: "channel._id",
                foreignField: "channel",
                as: "channel.subscribers",
            },
        },
        {
            $addFields: {
                "channel.subscribersCount": {
                    $size: "$channel.subscribers",
                },
            },
        },
        {
            $project: {
                "channel.subscribers": 0,
                "channel.password": 0,
                "channel.refreshToken": 0,
                "channel.watchHistory": 0,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalSubscribedChannels: channels.length,
                channels,
            },
            "Subscribed channels fetched successfully"
        )
    );
});


// ================= EXPORTS =================
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};