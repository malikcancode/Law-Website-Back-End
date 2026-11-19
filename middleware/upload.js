const multer = require('multer');

const fileFilter = (_req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (PNG, JPG, WEBP, GIF, SVG)'));
  }
};

// Memory storage — Vercel has no persistent disk; logo is saved to MongoDB as a data URL
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 1.5 * 1024 * 1024 },
}).single('logo');

module.exports = { uploadLogo };
