// router/booking.js
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const express = require("express");
const router = express.Router({ mergeParams: true });
const bookingController = require("../controllers/booking"); // Ensure this path is correct
const { isLoggedIn } = require("../middleware.js");

// In router/booking.js
router.get("/:id/book", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    // Ensure Listing is required at the top of this file!
    const listing = await Listing.findById(id); 
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listing/book.ejs", { listing });
});

router.post("/:id/confirm", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    let { checkIn, checkOut, guests } = req.body.booking;

    router.post("/:id/confirm", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    let { checkIn, checkOut, guests } = req.body.booking;

    // 1. Find the listing to get its price
    const listing = await Listing.findById(id);

    // 2. Check for booking conflicts (This is your gatekeeper)
    const existingBooking = await Booking.findOne({
        listing: id,
        $or: [
            { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
        ]
    });

    // 3. If a conflict exists, stop and show an error
    if (existingBooking) {
        req.flash("error", "Sorry, this Vista is already booked for these dates!");
        return res.redirect(`/listings/${id}`);
    }

    // 4. Calculate price
    const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    const totalPrice = days * listing.price;

    // 5. SAVE THE BOOKING (This prevents the second booking)
    const newBooking = new Booking({
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: guests,
        totalPrice: totalPrice,
        guest: req.user._id,
        listing: id
    });
    await newBooking.save();

    // 6. Generate QR Code
    const QRCode = require('qrcode');
    const upiLink = `upi://pay?pa=your-vpa@upi&pn=ExploreVista&am=${totalPrice}&cu=INR`;
    const qrCodeImage = await QRCode.toDataURL(upiLink);

    res.render("listing/summary.ejs", { listing, checkIn, checkOut, totalPrice, qrCodeImage });
});

    // 1. Conflict Check (Keep your existing code here)
    const conflict = await Booking.findOne({
        listing: id,
        $or: [{ checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }]
    });

    if (conflict) {
        req.flash("error", "These dates are already booked!");
        return res.redirect(`/listings/${id}`);
    }
    
    // 2. Price Calculation
    const listing = await Listing.findById(id);
    const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    const totalPrice = days * listing.price;

    // 3. NEW: Save the booking to the database now!
    const newBooking = new Booking({
        checkIn,
        checkOut,
        guests,
        totalPrice,
        listing: id,
        guest: req.user._id,
        status: "Pending" // Marks it as reserved but not paid
    });
    await newBooking.save();

    // 4. Generate QR Code
    const QRCode = require('qrcode');
    const upiLink = `upi://pay?pa=your-vpa@upi&pn=ExploreVista&am=${totalPrice}&cu=INR`;
    const qrCodeImage = await QRCode.toDataURL(upiLink);

    res.render("listing/summary.ejs", { listing, checkIn, checkOut, totalPrice, qrCodeImage });
});

// POST route to handle the final confirmation after payment
router.post("/:id/final", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    
    // In a real app, you'd verify payment here. 
    // For your project, we will assume payment is successful.
    
    // 1. You can pull the temporary booking data from the session 
    // or hidden inputs in your summary page.
    // For now, let's just send a success message.
    
    req.flash("success", "Booking Successful! Pack your bags.");
    res.redirect(`/listings/${id}`);
});

module.exports = router;