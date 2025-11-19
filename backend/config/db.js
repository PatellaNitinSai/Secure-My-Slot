const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    return;
  }

  try {
    await mongoose.connect(uri); // no deprecated options needed
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // Do NOT crash here — Render will repeatedly restart the service
    // Let the server run even if DB is down (optional)
  }
}

module.exports = connectDB;
