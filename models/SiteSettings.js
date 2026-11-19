const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 800 },
  },
  { _id: true }
);

const caseTypeSchema = new mongoose.Schema(
  {
    value: { type: String, required: true, trim: true, maxlength: 80 },
    label: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: true }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    firmName: { type: String, required: true, trim: true, maxlength: 200 },
    shortName: { type: String, required: true, trim: true, maxlength: 80 },
    license: { type: String, trim: true, maxlength: 120, default: '' },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    whatsapp: { type: String, required: true, trim: true, maxlength: 30 },
    publicEmail: { type: String, trim: true, maxlength: 160, default: '' },
    address: { type: String, trim: true, maxlength: 240, default: '' },
    hours: { type: String, trim: true, maxlength: 120, default: '' },
    logoUrl: { type: String, trim: true, maxlength: 400, default: '' },
    services: { type: [serviceSchema], default: [] },
    caseTypes: { type: [caseTypeSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
