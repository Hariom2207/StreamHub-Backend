import { Router } from "express";
import { varifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    incrementVideoViews
} from "../controllers/video.controller.js";

const router = Router();

// ─── PUBLIC ROUTES ─────────────────────────────
router.get("/", getAllVideos);
router.get("/:videoId", getVideoById);


// ─── PROTECTED ROUTES ──────────────────────────

//  VIDEO UPLOAD (IMPORTANT FIX HERE)
router.post(
    "/",
    varifyJWT,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

// UPDATE THUMBNAIL ONLY
router.patch(
    "/:videoId",
    varifyJWT,
    upload.single("thumbnail"),
    updateVideo
);

router.post("/:videoId/view", incrementVideoViews)

// DELETE VIDEO
router.delete("/:videoId", varifyJWT, deleteVideo);

// TOGGLE PUBLISH
router.patch(
    "/toggle/publish/:videoId",
    varifyJWT,
    togglePublishStatus
);

export default router;