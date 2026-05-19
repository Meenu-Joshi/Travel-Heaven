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
    let { id } = req.params;
    
    // Check for a confirmed booking that is either active today or in the future
    const activeBooking = await Booking.findOne({ 
        listing: id, 
        guest: req.user._id, 
        status: "Confirmed",
        checkOut: { $gte: new Date() } // This ensures only future/current stays block the user
    });

    if (activeBooking) {
        req.flash("error", "You already have an upcoming stay at this destination!");
        return res.redirect(`/listings/${id}`);
    }

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listing/book.ejs", { listing });
});

// 2. POST: Create Razorpay Order

router.post("/confirm", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params; // Inherited from app.js perfectly
        
        // Ensure request body structures exist safely
        if (!req.body.booking) {
            req.flash("error", "Invalid form data submission.");
            return res.redirect("back");
        }

        let { checkIn, checkOut, guests } = req.body.booking;
        
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Destination listing not found.");
            return res.redirect("/listings");
        }

        // Parse and validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            req.flash("error", "Please provide valid booking dates.");
            return res.redirect("back");
        }

        // Date conflict check logic
        const conflict = await Booking.findOne({
            listing: id,
            $or: [
                { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
            ]
        });

        if (conflict) {
            req.flash("error", "Sorry, these dates are already booked!");
            return res.redirect(`/listings/${id}`);
        }

        // Calculate days safely
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (days <= 0) {
            req.flash("error", "Check-out date must be after the check-in date.");
            return res.redirect("back");
        }

        // Calculate amount in paise
        const amount = Math.round(days * listing.price * 100); 

        if (isNaN(amount) || amount <= 0) {
            req.flash("error", "Invalid total payment calculation.");
            return res.redirect("back");
        }

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
            amount: amount, 
            currency: "INR",
            receipt: `rcpt_${id.toString().slice(-15)}`
        });

        // Save a 'Pending' booking record
        const newBooking = new Booking({
            listing: id,
            guest: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: Number(guests) || 1, 
            totalPrice: (amount / 100),
            razorpay_order_id: order.id,
            status: "Pending"
        });
        await newBooking.save();

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
        // This will now catch any unexpected exceptions reliably
        console.log("CRITICAL ERROR IN ROUTE:");
        console.error(err);
        req.flash("error", "Something went wrong with the payment setup.");
        res.redirect("back");
    }
});
// 3. POST: Verify Payment and Update Status
router.post("/verify-payment", isLoggedIn, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId } = req.body;
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest("hex");

        if (generated_signature === razorpay_signature) {
            // Confirm the booking status in the database
            await Booking.findOneAndUpdate(
                { razorpay_order_id: razorpay_order_id },
                { status: "Confirmed", paymentId: razorpay_payment_id }
            );

            req.flash("success", "Payment Successful! Your stay is confirmed.");
            res.json({ status: "success", redirectUrl: `/listings/${listingId}/bookings/success` });
        } else {
            res.status(400).json({ status: "failure", message: "Invalid Signature" });
        }
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
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