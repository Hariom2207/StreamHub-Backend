import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    // get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if(!videoId){
        throw ApiError(400,"videoId is required")  //validation check
    }


const totalComments = await Comment.countDocuments({ video: videoId });    // Total Comments
    
    //Fetch Comments
    const comments = await Comment.find({video: videoId})
    .populate("owner", "username avatar")
    .sort({createdAt : -1})
    .skip((pageNumber-1)*limitNumber)
    .limit(limitNumber)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalComments,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComments / limitNumber),
                comments
            },
            "Comments fetched successfully"
        )
    );  
});

const addComment = asyncHandler(async (req, res) => {

    //  Extract data
    const { videoId } = req.params;
    const { content } = req.body;

    //  Get logged-in user
    const userId = req.user?._id;

    //  Validation
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    //  Create comment
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    //  Populate user info (optional but useful)
    const populatedComment = await comment.populate(
        "owner",
        "username avatar"
    );

    //  Response
    return res.status(201).json(
        new ApiResponse(
            201,
            populatedComment,
            "Comment added successfully"
        )
    );
});

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    // Basic validations
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    //  Fetch comment from DB
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    //  Ownership check
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only edit your own comment");
    }

    //  Update data
    comment.content = content;

    //  Save changes
    await comment.save();

    //  Populate for UI
    const updatedComment = await comment.populate(
        "owner",
        "username avatar"
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const userId = req.user?._id;

    //  Validation
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    //  Fetch comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    //  Ownership check
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own comment");
    }

    //  Delete
    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }