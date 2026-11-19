const multer = require("multer");
const { randomUUID } = require("node:crypto");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, `${randomUUID()}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    const extensiones = [".jpg", ".jpeg", ".png", ".webp"];

    const extension = path.extname(file.originalname).toLowerCase();

    if (
        extensiones.includes(extension) &&
        ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error("Formato de imagen no permitido"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;
