import multer from "multer";

function fileFilter(_req, file, cb) {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only PDF and Word documents (.pdf, .doc, .docx) are allowed."));
}

const documentUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

export default documentUpload;
