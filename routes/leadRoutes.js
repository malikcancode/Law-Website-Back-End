const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const {
  createLead,
  getLeads,
  getStats,
  exportLeads,
  getLead,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again shortly.' },
});

router.post('/', submitLimiter, createLead);

router.get('/', protect, getLeads);
router.get('/stats', protect, getStats);
router.get('/export', protect, exportLeads);
router.get('/:id', protect, getLead);
router.patch('/:id', protect, updateLead);
router.delete('/:id', protect, deleteLead);

module.exports = router;
