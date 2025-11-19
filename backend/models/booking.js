const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  selectedSlot: {         
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
