// routes/authRoutes.js
const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  bookings,
  getBookings,
  getUsers,
  updateCollection
} = require("../controllers/authController");
const { auth, authorize } = require("../middleware/auth"); // <-- use the middleware
const router = express.Router();

router.post(
  "/register",
  [
    body("name").optional().isString().trim().isLength({ min: 2 }),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars")
  ],
  register
);

// login stays public
router.post("/login", login);

// Protect booking creation — user must be authenticated
router.post("/bookings", auth, bookings);

// Protect GET bookings — authenticated only
router.get("/get-bookings", auth, getBookings);

// Protect users listing — authenticated only (you may restrict to admin)
router.get("/get-users", auth, getUsers);

// Protect update API — optionally only admin: auth + authorize('admin')
router.patch("/update-users/:id", auth, updateCollection);

module.exports = router;
