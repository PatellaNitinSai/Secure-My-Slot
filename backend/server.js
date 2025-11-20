// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * Define distPath early so it's available everywhere if needed.
 * NOTE: hil-booking is outside backend in your repo, so this path may not exist in backend service.
 */
const distPath = path.join(__dirname, 'dist', 'hil-booking');

/* Connect DB (you asked to ignore Mongo errors for now) */
try {
  connectDB();
} catch (err) {
  console.warn('DB connect attempt produced an error (ignored for now):', err && err.message);
}

/* JSON parsing */
app.use(express.json());

/* Simple health-check */
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

/* CORS - allow only your frontend(s) */
const allowedOrigins = [
  'https://secure-my-slot-1.onrender.com',
  // add others if needed, e.g. 'https://secure-my-slot.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server, curl, etc.
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* API routes (keep before static/fallback) */
app.use('/api/auth', authRoutes);

/* Serve frontend static files only if they exist in this service */
if (fs.existsSync(distPath)) {
  console.log('✅ Frontend dist found — enabling static file serving from:', distPath);
  app.use(express.static(distPath));

  // SPA fallback for requests that accept HTML (keeps API clients safe)
  app.use((req, res, next) => {
    const accept = req.headers.accept || '';
    if (accept.indexOf('text/html') !== -1) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
} else {
  console.log('ℹ️ Frontend dist NOT found at', distPath);
  console.log('   Backend will serve APIs only. If you want backend to host frontend, build/copy the frontend into this service.');
  // Provide a simple root endpoint so GET / doesn't 500
  app.get('/', (req, res) => res.send('Backend API working ✔'));
}

/* Generic 404 handler for unmatched routes */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* Error handler */
app.use((err, req, res, next) => {
  console.error('Server error:', err && err.message ? err.message : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error', message: err && err.message });
});

/* Start server */
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
