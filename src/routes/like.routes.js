import { Router } from "express";
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
} from "../controllers/like.controller.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/video/:videoId/toggle", varifyJWT, toggleVideoLike);
router.post("/comment/:commentId/toggle", varifyJWT, toggleCommentLike);
router.post("/tweet/:tweetId/toggle", varifyJWT, toggleTweetLike);

router.get("/videos", varifyJWT, getLikedVideos);

export default router;