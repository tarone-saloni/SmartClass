import multer from "multer";

function fileFilter(_req, file, cb) {
  const allowed = [
    // Videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    // Documents
    "application/pdf",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type. Allowed: videos (mp4/webm), PDFs, and images."));
}

// Use memory storage — buffer is passed to Cloudinary, nothing saved to disk
const materialUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

export default materialUpload;
