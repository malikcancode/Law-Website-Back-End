// Usage: npm run seed:admin -- email@example.com "StrongPassword" "Name"
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

(async () => {
  const [email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD, name = process.env.ADMIN_NAME || 'Admin'] =
    process.argv.slice(2);

  if (!email || !password) {
    console.error('Provide email and password as arguments or in .env');
    process.exit(1);
  }

  await connectDB();
  const existing = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (existing) {
    existing.password = password;
    existing.name = name;
    await existing.save();
    console.log(`Admin updated: ${email}`);
  } else {
    await Admin.create({ name, email, password });
    console.log(`Admin created: ${email}`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
