const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safe = `.${ext.replace('.', '')}`.replace(/[^.a-z0-9]/gi, '');
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
