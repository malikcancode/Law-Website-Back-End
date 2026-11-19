const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const { STATUSES } = require('../models/Lead');
const SiteSettings = require('../models/SiteSettings');
const { validateLead } = require('../utils/validateLead');
const { defaultSettings } = require('../utils/defaultSettings');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (query) => {
  const filter = {};
  if (query.status && STATUSES.includes(query.status)) filter.status = query.status;
  if (query.caseType) filter.caseType = String(query.caseType).trim();

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  if (query.search && query.search.trim()) {
    const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { fullName: rx },
      { phone: rx },
      { email: rx },
      { companyName: rx },
      { city: rx },
    ];
  }
  return filter;
};

// POST /api/leads  (public)
exports.createLead = async (req, res, next) => {
  try {
    // Honeypot field: real visitors never fill it
    if (req.body && req.body.website) {
      return res.status(201).json({ success: true, message: 'Your request was received.' });
    }

    const settings = (await SiteSettings.findOne({ key: 'default' }).lean()) || defaultSettings;
    const { isValid, errors, data } = validateLead(req.body, settings.caseTypes || []);
    if (!isValid) {
      return res.status(422).json({ success: false, message: 'Please review the required fields', errors });
    }

    const lead = await Lead.create({
      ...data,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Your request was received. One of our advisors will contact you shortly.',
      id: lead._id,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/leads  (admin)
exports.getLeads = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const sortField = ['createdAt', 'fullName', 'status', 'caseType'].includes(req.query.sort)
      ? req.query.sort
      : 'createdAt';
    const sortDir = req.query.order === 'asc' ? 1 : -1;

    const filter = buildFilter(req.query);

    const [items, total] = await Promise.all([
      Lead.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/leads/stats  (admin)
exports.getStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [total, today, byStatus, byCaseType, daily] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: startOfToday } }),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: '$caseType', count: { $sum: 1 } } }]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+03:00' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const toMap = (rows) => rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});

    res.json({
      success: true,
      data: {
        total,
        today,
        byStatus: toMap(byStatus),
        byCaseType: toMap(byCaseType),
        daily,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/leads/export  (admin) -> CSV
exports.exportLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find(buildFilter(req.query)).sort({ createdAt: -1 }).lean();

    const columns = [
      ['createdAt', 'Submitted'],
      ['fullName', 'Name'],
      ['phone', 'Phone'],
      ['email', 'Email'],
      ['companyName', 'Company'],
      ['city', 'City'],
      ['caseType', 'Case type'],
      ['amountRange', 'Amount'],
      ['preferredContact', 'Preferred contact'],
      ['status', 'Status'],
      ['message', 'Case summary'],
    ];

    const esc = (v) => {
      if (v === undefined || v === null) return '';
      const s = v instanceof Date ? v.toISOString() : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = [columns.map(([, label]) => esc(label)).join(',')];
    leads.forEach((lead) => rows.push(columns.map(([key]) => esc(lead[key])).join(',')));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${Date.now()}.csv"`);
    // BOM helps Excel open UTF-8 correctly
    res.send(`\uFEFF${rows.join('\n')}`);
  } catch (err) {
    next(err);
  }
};

const ensureId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return false;
  }
  return true;
};

// GET /api/leads/:id  (admin)
exports.getLead = async (req, res, next) => {
  try {
    if (!ensureId(req.params.id, res)) return;
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leads/:id  (admin) - update status and/or add a note
exports.updateLead = async (req, res, next) => {
  try {
    if (!ensureId(req.params.id, res)) return;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Request not found' });

    const { status, note } = req.body || {};
    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(422).json({ success: false, message: 'Invalid status' });
      }
      lead.status = status;
    }
    if (typeof note === 'string' && note.trim()) {
      lead.notes.push({ text: note.trim(), author: req.admin.name });
    }

    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/leads/:id  (admin)
exports.deleteLead = async (req, res, next) => {
  try {
    if (!ensureId(req.params.id, res)) return;
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    next(err);
  }
};
