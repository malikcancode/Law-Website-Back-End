const mongoose = require('mongoose');

const AMOUNT_RANGES = ['under_100k', '100k_500k', '500k_1m', 'over_1m', 'unspecified'];

const STATUSES = ['new', 'contacted', 'in_progress', 'closed', 'rejected'];

const CONTACT_METHODS = ['call', 'whatsapp', 'email'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    companyName: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    caseType: { type: String, required: true, trim: true, maxlength: 80 },
    amountRange: { type: String, enum: AMOUNT_RANGES, default: 'unspecified' },
    preferredContact: { type: String, enum: CONTACT_METHODS, default: 'call' },
    message: { type: String, trim: true, maxlength: 3000 },
    consent: { type: Boolean, required: true },

    status: { type: String, enum: STATUSES, default: 'new', index: true },
    notes: [noteSchema],

    source: {
      page: { type: String, trim: true, maxlength: 300 },
      referrer: { type: String, trim: true, maxlength: 300 },
      utmSource: { type: String, trim: true, maxlength: 100 },
      utmMedium: { type: String, trim: true, maxlength: 100 },
      utmCampaign: { type: String, trim: true, maxlength: 100 },
    },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true, maxlength: 400 },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ fullName: 'text', phone: 'text', companyName: 'text', email: 'text' });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
module.exports.AMOUNT_RANGES = AMOUNT_RANGES;
module.exports.STATUSES = STATUSES;
module.exports.CONTACT_METHODS = CONTACT_METHODS;
