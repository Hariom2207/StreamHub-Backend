import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//  toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    // Validation
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    if (existingSubscription) {
        // Unsubscribe
        await Subscription.deleteOne({ _id: existingSubscription._id });

        return res.status(200).json(
            new ApiResponse(200, null, "Unsubscribed successfully")
        );
    }

    // Subscribe
    const subscription = await Subscription.create({
        subscriber: userId,
        channel: channelId
    });

    return res.status(201).json(
        new ApiResponse(201, subscription, "Subscribed successfully")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const skip = (page - 1) * limit;

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email avatar")
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                total,
                page: Number(page),
                limit: Number(limit),
                subscribers
            },
            "Subscribers fetched successfully"
        )
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const userId = req.user?._id;

    //  Validation
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    //  Authorization check 🔐
    if (subscriberId !== userId.toString()) {
        throw new ApiError(403, "Access denied");
    }

    //  Fetch data
    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email avatar")
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalSubscribedChannels: channels.length,
                channels
            },
            "Subscribed channels fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}