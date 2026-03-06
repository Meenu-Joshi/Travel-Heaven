// router/booking.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const bookingController = require("../controllers/booking"); // Ensure this path is correct
const { isLoggedIn } = require("../middleware.js");

// This handles: GET /listings/:id/bookings/book
router.get("/book", isLoggedIn, bookingController.renderBookingForm);

// This handles: POST /listings/:id/bookings
router.post("/", isLoggedIn, bookingController.createBooking);

module.exports = router;