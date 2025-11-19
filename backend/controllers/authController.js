const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const booking = require("../models/booking")
const utils = require("../mongo_utils/utils")
const { update_collection } = require("../mongo_utils/utils");
const { v4: uuidv4 } = require("uuid");
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

exports.register = async (req, res) => {
  try {

   signupCollection = await utils.getCollection("signup")
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password} = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash || "user" });
    await signupCollection.insertOne({
      userId: user._id,
      name: user.name,
      email: user.email,
      password:user.password,
      approved : false,
      createdAt: new Date()
    });
    const token = signToken(user);
    res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, email: user.email, name: user.name },
      token
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🚫 Block if not approved
    if (!user.approved) {
      return res.status(403).json({
        message: "Your account is not approved yet. Please contact the administrator."
      });
    }

    const token = signToken(user);
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};


exports.bookings = async (req, res) => {
  try {
    // Get Mongo collection
    const BookingCollection = await utils.getCollection('bookings');

    // Extract data from request body
    const { name, email, date, duration, selectedSlot } = req.body;

    // Basic validation
    if (!name || !email || !date || !duration || !selectedSlot) {
      console.warn('Booking validation failed:', { name, email, date, duration, selectedSlot });
      return res.status(400).json({ success: false, message: 'Missing booking fields' });
    }

    // Build document
    const doc = {
      booking_id:  uuidv4(),
      name,
      email,
      date: new Date(date), // store as Date object if date is ISO string
      duration,
      selectedSlot: {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      },
      created_at: new Date()
    };

    // Insert into MongoDB
    const result = await BookingCollection.insertOne(doc);
    console.log('Booking inserted with id:', result.insertedId);

    // Single successful response
    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {name, email,date,duration,selectedSlot},
      bookingId: result.insertedId
    });

  } catch (error) {
    // If an error occurs, make sure we send exactly one error response
    console.error('Booking Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } else {
      // headers already sent, just log and end (avoid sending another response)
      console.error('Cannot send error response; headers already sent.');
      return;
    }
  }
};

exports.getBookings = async (req, res) => {
  try {
    const data = await utils.get_data('bookings');
    return res.status(200).json(data);
  } catch (err) {
    console.error('getBookings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const data = await utils.get_data('users');
    return res.status(200).json(data);
  } catch (err) {
    console.error('getBookings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { collection, updateFields } = req.body;

    if (!collection) {
      return res.status(400).json({ error: "collection is required in body" });
    }

    if (!updateFields || typeof updateFields !== "object") {
      return res
        .status(400)
        .json({ error: "updateFields (object) is required in body" });
    }

    const result = await update_collection(collection, id, updateFields);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.status(200).json({
      message: "Document updated successfully",
      result
    });
  } catch (err) {
    console.error("Error in updateCollection controller:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};