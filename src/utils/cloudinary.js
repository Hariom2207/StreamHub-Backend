import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//  UPLOAD
export const uploadOnCloudinary = async (filePath, resourceType = "auto") => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: resourceType
        });

        console.log(" CLOUDINARY SUCCESS:", result.secure_url);

        return result;

    } catch (error) {
        console.log(" CLOUDINARY ERROR FULL:", error); //  THIS IS IMPORTANT
        return null;
    }
};


//  DELETE
export const deleteFromCloudinary = async (url, resourceType = "image") => {
    try {
        const parts = url.split("/");
        const file = parts[parts.length - 1];
        const publicId = file.split(".")[0];

        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

    } catch (error) {
        console.log("Delete error:", error);
    }
};