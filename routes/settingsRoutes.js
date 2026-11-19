const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  uploadLogo,
  removeLogo,
} = require('../controllers/settingsController');

const router = express.Router();

router.get('/', getPublicSettings);

router.get('/admin', protect, getAdminSettings);
router.put('/', protect, updateSettings);
router.post('/logo', protect, uploadLogo);
router.delete('/logo', protect, removeLogo);

module.exports = router;
