const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const signToken = (admin) =>
  jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const adminPayload = (admin) => ({ id: admin._id, name: admin.name, email: admin.email });

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    res.json({
      success: true,
      token: signToken(admin),
      admin: adminPayload(admin),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ success: true, admin: adminPayload(req.admin) });
};

// PATCH /api/auth/profile  — name + email
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword } = req.body || {};
    const admin = await Admin.findById(req.admin._id).select('+password');

    if (name !== undefined) {
      const cleaned = String(name).trim();
      if (cleaned.length < 2) {
        return res.status(422).json({ success: false, message: 'Name must be at least 2 characters' });
      }
      admin.name = cleaned.slice(0, 80);
    }

    if (email !== undefined) {
      const nextEmail = String(email).toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        return res.status(422).json({ success: false, message: 'Enter a valid email address' });
      }
      if (nextEmail !== admin.email) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Enter your current password to change the login email',
          });
        }
        if (!(await admin.comparePassword(currentPassword))) {
          return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        const taken = await Admin.findOne({ email: nextEmail, _id: { $ne: admin._id } });
        if (taken) {
          return res.status(409).json({ success: false, message: 'That email is already in use' });
        }
        admin.email = nextEmail;
      }
    }

    await admin.save();
    res.json({
      success: true,
      message: 'Account updated',
      admin: adminPayload(admin),
      token: signToken(admin),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return res.status(422).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }
    const admin = await Admin.findById(req.admin._id).select('+password');
    if (!(await admin.comparePassword(currentPassword || ''))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    admin.password = newPassword;
    await admin.save();
    res.json({
      success: true,
      message: 'Password updated',
      token: signToken(admin),
      admin: adminPayload(admin),
    });
  } catch (err) {
    next(err);
  }
};

exports.ensureDefaultAdmin = async () => {
  const count = await Admin.countDocuments();
  if (count > 0) return;
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('No admin exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set.');
    return;
  }
  await Admin.create({ name: ADMIN_NAME || 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  console.log(`Default admin created: ${ADMIN_EMAIL}`);
};
