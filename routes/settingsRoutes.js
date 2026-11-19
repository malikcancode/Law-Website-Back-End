const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  uploadLogo: uploadLogoHandler,
  removeLogo,
} = require('../controllers/settingsController');

const router = express.Router();

router.get('/', getPublicSettings);

router.get('/admin', protect, getAdminSettings);
router.put('/', protect, updateSettings);
router.post('/logo', protect, (req, res, next) => {
  uploadLogo(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    return uploadLogoHandler(req, res, next);
  });
});
router.delete('/logo', protect, removeLogo);

module.exports = router;
