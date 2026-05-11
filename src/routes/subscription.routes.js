import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {varifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(varifyJWT); // Apply verifyJWT middleware to all routes in this file

// 
router.route("/c/:channelId")
  .get(getUserChannelSubscribers)  // channel ke subscribers
  .post(toggleSubscription);

router.route("/u/:subscriberId")
  .get(getSubscribedChannels);     // user ne kise subscribe kiya

export default router