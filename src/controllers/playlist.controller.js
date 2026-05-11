import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //  Extract data from request
    const { name, description } = req.body;

    //  Validate input
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required");
    }

    //  Create playlist in DB
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id
    });

    //  Send response
    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    //  Extract params & query
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    //  Validate userId
    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    //  (Optional) Authorization check
    // Uncomment if playlists should be private
    /*
    if (req.user._id.toString() !== userId) {
        throw new ApiError(403, "You are not allowed to access these playlists");
    }
    */

    //  Pagination logic
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    //  Fetch playlists
    const playlists = await Playlist.find({ owner: userId })
        .select("name description videos createdAt") // only needed fields
        .sort({ createdAt: -1 }) // latest first
        .skip(skip)
        .limit(limitNumber);

    //  Count total (for pagination info)
    const totalPlaylists = await Playlist.countDocuments({ owner: userId });

    // Response
    return res.status(200).json(
        new ApiResponse(200, {
            playlists,
            pagination: {
                total: totalPlaylists,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalPlaylists / limitNumber)
            }
        }, "User playlists fetched successfully")
    );
});
const getPlaylistById = asyncHandler(async (req, res) => {
    //  Extract playlistId
    const { playlistId } = req.params;

    //  Validate ID
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    //  Fetch playlist
    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnail duration") // optional
        .populate("owner", "username email"); // optional

    //  Check existence
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    //  (Optional) Authorization check
    /*
    if (playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }
    */

    //  Send response
    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    //  Extract params
    const { playlistId, videoId } = req.params;

    //  Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    //  Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    //  Authorization (only owner can modify)
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this playlist");
    }

    //  Add video (prevent duplicates)
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: videoId }
        },
        { new: true }
    );

    //  Send response
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    //  Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    //  Check playlist exists
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    //  Authorization (only owner can modify)
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to modify this playlist");
    }

    //  Remove video from playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        { new: true }
    );

    // Response
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    //  Validate ID
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    //  Check playlist exists
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    //  Authorization (only owner can delete)
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to delete this playlist");
    }

    //  Delete playlist
    await Playlist.findByIdAndDelete(playlistId);

    //  Response
    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    //  Validate playlistId
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    //  Check playlist exists
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    //  Authorization (only owner can update)
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not allowed to update this playlist");
    }

    //  Prepare update data (partial update)
    const updateData = {};

    if (name && name.trim() !== "") {
        updateData.name = name.trim();
    }

    if (description !== undefined) {
        updateData.description = description?.trim() || "";
    }

    //  Check if anything to update
    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    //  Update playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        updateData,
        { new: true }
    );

    //  Response
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}