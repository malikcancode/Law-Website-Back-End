const SiteSettings = require('../models/SiteSettings');
const { defaultSettings } = require('../utils/defaultSettings');

const publicShape = (doc) => ({
  firmName: doc.firmName,
  shortName: doc.shortName,
  license: doc.license,
  phone: doc.phone,
  whatsapp: doc.whatsapp,
  publicEmail: doc.publicEmail,
  address: doc.address,
  hours: doc.hours,
  logoUrl: doc.logoUrl,
  services: (doc.services || []).map((s) => ({
    id: s._id,
    title: s.title,
    body: s.body,
  })),
  caseTypes: (doc.caseTypes || []).map((c) => ({
    id: c._id,
    value: c.value,
    label: c.label,
  })),
  updatedAt: doc.updatedAt,
});

const getOrCreate = async () => {
  let doc = await SiteSettings.findOne({ key: 'default' });
  if (!doc) {
    doc = await SiteSettings.create(defaultSettings);
  }
  return doc;
};

exports.ensureDefaultSettings = async () => {
  await getOrCreate();
};

// GET /api/settings  (public)
exports.getPublicSettings = async (req, res, next) => {
  try {
    const doc = await getOrCreate();
    res.json({ success: true, data: publicShape(doc) });
  } catch (err) {
    next(err);
  }
};

// GET /api/settings/admin  (admin)
exports.getAdminSettings = async (req, res, next) => {
  try {
    const doc = await getOrCreate();
    res.json({ success: true, data: publicShape(doc) });
  } catch (err) {
    next(err);
  }
};

const clean = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

const slugify = (label) =>
  String(label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || `type_${Date.now()}`;

// PUT /api/settings  (admin) — firm profile, services, case types
exports.updateSettings = async (req, res, next) => {
  try {
    const doc = await getOrCreate();
    const body = req.body || {};

    if (body.firmName !== undefined) doc.firmName = clean(body.firmName, 200) || doc.firmName;
    if (body.shortName !== undefined) doc.shortName = clean(body.shortName, 80) || doc.shortName;
    if (body.license !== undefined) doc.license = clean(body.license, 120) || '';
    if (body.phone !== undefined) doc.phone = clean(body.phone, 30) || doc.phone;
    if (body.whatsapp !== undefined) doc.whatsapp = clean(body.whatsapp, 30) || doc.whatsapp;
    if (body.publicEmail !== undefined) doc.publicEmail = clean(body.publicEmail, 160) || '';
    if (body.address !== undefined) doc.address = clean(body.address, 240) || '';
    if (body.hours !== undefined) doc.hours = clean(body.hours, 120) || '';

    if (Array.isArray(body.services)) {
      const services = body.services
        .map((s) => ({
          title: clean(s.title, 160),
          body: clean(s.body, 800),
        }))
        .filter((s) => s.title && s.body);
      if (services.length === 0) {
        return res.status(422).json({ success: false, message: 'Add at least one service' });
      }
      doc.services = services;
    }

    if (Array.isArray(body.caseTypes)) {
      const seen = new Set();
      const caseTypes = body.caseTypes
        .map((c) => {
          const label = clean(c.label, 160);
          const value = clean(c.value, 80) || slugify(label);
          return { value, label };
        })
        .filter((c) => c.label && c.value)
        .filter((c) => {
          if (seen.has(c.value)) return false;
          seen.add(c.value);
          return true;
        });
      if (caseTypes.length === 0) {
        return res.status(422).json({ success: false, message: 'Add at least one case type' });
      }
      doc.caseTypes = caseTypes;
    }

    await doc.save();
    res.json({ success: true, data: publicShape(doc), message: 'Settings saved' });
  } catch (err) {
    next(err);
  }
};

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/i;
const MAX_LOGO_CHARS = 1_800_000; // ~1.3MB binary

// POST /api/settings/logo  (admin) — JSON { logo: "data:image/...;base64,..." }
exports.uploadLogo = async (req, res, next) => {
  try {
    const logo = typeof req.body?.logo === 'string' ? req.body.logo.trim() : '';
    if (!logo || !DATA_URL_RE.test(logo)) {
      return res.status(400).json({
        success: false,
        message: 'Send a valid image as a data URL (PNG, JPG, WEBP, GIF, or SVG)',
      });
    }
    if (logo.length > MAX_LOGO_CHARS) {
      return res.status(400).json({
        success: false,
        message: 'Logo is too large. Please use an image under 1MB.',
      });
    }

    const doc = await getOrCreate();
    doc.logoUrl = logo.replace(/\s+/g, '');
    await doc.save();

    res.json({
      success: true,
      data: publicShape(doc),
      message: 'Logo updated',
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/settings/logo  (admin)
exports.removeLogo = async (req, res, next) => {
  try {
    const doc = await getOrCreate();
    doc.logoUrl = '';
    await doc.save();
    res.json({ success: true, data: publicShape(doc), message: 'Logo removed' });
  } catch (err) {
    next(err);
  }
};
