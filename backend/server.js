// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * Connect to DB
 */
connectDB();

/**
 * JSON body parsing
 */
app.use(express.json());

/**
 * CORS - allow the frontend(s) to call your API.
 * Replace or extend the origins array if you add more frontends.
 */
const allowedOrigins = [
  // 'https://secure-my-slot.onrender.com', // keep if still needed
  'https://secure-my-slot-1.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: This origin is not allowed: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * API routes
 * Keep API routes before the static-file fallback
 */
app.use('/api/auth', authRoutes);

/**
 * Serve static Angular files if they exist.
 * (This is useful if you ever want to host frontend and backend together.)
 */
const distPath = path.join(__dirname, 'dist', 'hil-booking');
app.use(express.static(distPath));

/**
 * SPA fallback: serve index.html for any other route (so client-side router works)
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
