// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

/* Connect DB */
connectDB();

/* JSON parsing */
app.use(express.json());

/* CORS */
const allowedOrigins = [
  'https://secure-my-slot-1.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* API routes */
app.use('/api/auth', authRoutes);

/* Serve Angular */
const distPath = path.join(__dirname, 'dist', 'hil-booking');
app.use(express.static(distPath));

/* SPA fallback — Express 5 FIX */
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/* Start server */
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
