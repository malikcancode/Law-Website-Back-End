const path = require('path');
const fs = require('fs');
const multer = require('multer');

// On Vercel the filesystem is read-only except /tmp
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn('Could not create upload dir:', err.message);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const finalExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext) ? ext : '.png';
    cb(null, `logo-${Date.now()}${finalExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (PNG, JPG, WEBP, GIF, SVG)'));
  }
};

const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('logo');

module.exports = { uploadLogo, uploadDir };
