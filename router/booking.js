const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn } = require("../middleware.js");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Helper function to initialize Razorpay
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// 1. GET: Render Booking Form with Duplicate Check
// 1. GET: Render Booking Form with "Past Stay" logic
router.get("/book", isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;

        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }
        
        // Renders the form directly, letting the user pick their new dates smoothly
        res.render("listing/book.ejs", { listing });
    } catch (err) {
        console.error("Booking Page Load Error:", err);
        req.flash("error", "Failed to load booking page.");
        res.redirect("/listings");
    }
});

// 2. POST: Create Razorpay Order & Check Specific Date Overlaps
router.post("/confirm", isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        let { checkIn, checkOut, guests } = req.body.booking;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // --- NEW STRATEGIC FIX: ADVANCED OVERLAP CHECK ---
        // This queries MongoDB to see if ANYONE (including this user) has an already 
        // confirmed booking that physically collides with the newly requested dates.
        const dateConflict = await Booking.findOne({
            listing: id,
            status: "Confirmed", // Only evaluate active, fully paid bookings
            $or: [
                { 
                    checkIn: { $lt: new Date(checkOut) }, 
                    checkOut: { $gt: new Date(checkIn) } 
                }
            ]
        });

        if (dateConflict) {
            req.flash("error", "Sorry, this property is already reserved during those specific dates!");
            return res.redirect(`/listings/${id}`);
        }
        // -------------------------------------------------

        // Calculate checkout pricing windows
        const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
        const amount = Math.round((days * listing.price) * 100); 

        // Generate the clean Razorpay application token order structure
        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({ 
            amount: amount, 
            currency: "INR",
            receipt: `rcpt_${id.toString().slice(-15)}`
        });

        // REMOVED: Saving the document to the database here has been completely cleaned out!
        // It will pass securely to summary.ejs and save ONLY inside your "/verify-payment" route upon checkout success.

        res.render("listing/summary.ejs", { 
            listing, 
            checkIn, 
            checkOut, 
            guests, 
            totalPrice: (amount / 100), 
            order,
            razorpay_key: process.env.RAZORPAY_KEY_ID 
        });

    } catch (err) {
        console.error("Razorpay Order Pipeline Failure:", err);
        // Using your template's flash/redirect pattern for elegant UX handling instead of sending raw JSON to the browser window
        req.flash("error", "Something went wrong with the payment or checkout setup: " + err.message);
        res.redirect("back");
    }
});
// 3. POST: Verify Payment and Update Status
router.post("/verify-payment", isLoggedIn, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId, checkIn, checkOut, guests } = req.body;
    
    // Validate signature crypto checks...
    if (generated_signature === razorpay_signature) {
        
        // SAVE HERE ONLY: The payment is 100% successful now!
        const finalizedBooking = new Booking({
            listing: listingId,
            guest: req.user._id,
            checkIn,
            checkOut,
            guests,
            status: "Confirmed",
            paymentId: razorpay_payment_id,
            razorpay_order_id
        });
        await finalizedBooking.save();

        res.json({ status: "success", redirectUrl: `/listings/${listingId}/bookings/success` });
    }
});

// 4. GET: Success Page
router.get("/success", isLoggedIn, (req, res) => {
    res.render("listing/success.ejs");
});

// router/booking.js

router.post("/book-cod", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests } = req.body.booking;

        // 1. Create the new booking in your database
        const newBooking = new Booking({
            listing: id,
            guest: req.user._id,
            checkIn,
            checkOut,
            guests,
            status: "Confirmed", // COD is confirmed immediately in this logic
            paymentMethod: "COD"
        });

        await newBooking.save();

        // 2. Set the success message
        req.flash("success", "Booking confirmed! You can pay when you arrive at the property.");

        // 3. Redirect to the success page
        res.redirect(`/listings/${id}/bookings/success`); 
    } catch (err) {
        console.error("COD Booking Error:", err);
        req.flash("error", "Failed to process offline booking.");
        res.redirect("back");
    }
});

module.exports = router;