import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    uptime: process.uptime(), // kitne time se server chl rha hai
                    timestamp: new Date().toLocaleString()
                },
                "Server is healthy "
            )
        );
});

export {
    healthcheck
};