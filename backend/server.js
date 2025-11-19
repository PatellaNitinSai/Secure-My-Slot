// server.js
const express = require('express');
require('dotenv').config()
const app = express();
const PORT = 3000;
const cors = require('cors')
app.use(express.json());
// const loginRoute = require('./routes/auth');
const connectDB = require("./config/db")
const authRoutes = require('./routes/auth');


connectDB();
// app.use('/api', loginRoute);

app.use(cors({
  origin: 'https://secure-my-slot.onrender.com',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// app.options('*', cors());

app.get("/", (req, res) => res.send("HIL API running"));
app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
