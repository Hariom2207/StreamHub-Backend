import multer from "multer";
import fs from "fs";
import path from "path";

// ensure folder exists
const uploadPath = "./public/temp";

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + ext);
    }
});

// file filter
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith("video") ||
        file.mimetype.startsWith("image")
    ) {
        cb(null, true);
    } else {
        cb(new Error("Only video and image files allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});