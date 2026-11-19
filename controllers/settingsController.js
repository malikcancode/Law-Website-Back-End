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

// POST /api/settings/logo  (admin) multipart — stored as data URL in MongoDB
exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please choose a logo image' });
    }

    const doc = await getOrCreate();
    const mime = req.file.mimetype || 'image/png';
    doc.logoUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
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
