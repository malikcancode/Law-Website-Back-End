require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const leadRoutes = require('./routes/leadRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { ensureDefaultAdmin } = require('./controllers/authController');
const { ensureDefaultSettings } = require('./controllers/settingsController');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const normalizeOrigin = (o) => String(o || '').trim().replace(/\/$/, '');

const allowedOrigins = [
  ...new Set(
    [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://lawfrontend-flame.vercel.app',
      'https://lawadmin.vercel.app',
      ...(process.env.CLIENT_ORIGINS || '').split(','),
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  ),
];

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(normalizeOrigin(origin))) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.use(morgan('dev'));
}

// Ensure DB (+ seed) before API routes on every cold start / request
let readyPromise = null;
const ensureReady = () => {
  if (!readyPromise) {
    readyPromise = connectDB()
      .then(ensureDefaultAdmin)
      .then(ensureDefaultSettings)
      .catch((err) => {
        readyPromise = null;
        throw err;
      });
  }
  return readyPromise;
};

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    console.error('Startup/DB error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server failed to connect to the database. Check MONGO_URI and Atlas network access.',
      detail: err.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({ success: true, service: 'lawyer-leads-api', health: '/api/health' });
});
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
