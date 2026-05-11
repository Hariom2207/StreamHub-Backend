import { Router } from "express";

import { loginUser,
         logOutUser,
         registerUser,
         refreshAccessToken,
         changeCurrentPassword,
         getCurrentUser,
         updateAccoundDetails,
         updateUserAvatar,
         updateUserCoverImage, 
         getUserChannelProfile,
         getWatchHistory,
         addToWatchHistory
       } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"
import { varifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    
    registerUser)

    router.route("/login").post(loginUser)

    //secured routes

    router.route("/logout").post(logOutUser)

    router.route("/refresh-token").post(refreshAccessToken)

    router.route("/change-password").post(varifyJWT ,changeCurrentPassword)

    router.route("/current-user").get(varifyJWT, getCurrentUser)

    router.route("/update-account").patch(varifyJWT, updateAccoundDetails)

    router.route("/avatar").patch(varifyJWT, upload.single("avatar"),updateUserAvatar)

    router.route("/cover-image").patch(varifyJWT, upload.single("coverImage"),updateUserCoverImage)

    router.route("/c/:username").get(varifyJWT, getUserChannelProfile)

    router.route('/history/:videoId').post(varifyJWT, addToWatchHistory)
    
    router.route("/history").get(varifyJWT,getWatchHistory)


export default router