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

router.get("/book", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id); 
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listing/book.ejs", { listing });
});

router.post("/confirm", isLoggedIn, async (req, res) => {
    try {
        let { id } = req.params;
        let { checkIn, checkOut } = req.body.booking;
        const listing = await Listing.findById(id);

        const conflict = await Booking.findOne({
            listing: id,
            $or: [
                { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
            ]
        });

        if (conflict) {
            req.flash("error", "Sorry, these dates are already booked!");
            return res.redirect(`/listings/${id}`);
        }

        const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
        const amount = Math.round((days * listing.price) * 100);

        // Initialize and create the order
        const razorpay = getRazorpayInstance(); 
        const order = await razorpay.orders.create({
            amount: amount,
            currency: "INR",
            receipt: `rcpt_${id.toString().slice(-15)}` 
        });

        res.render("listing/summary.ejs", { 
            listing, 
            checkIn, 
            checkOut, 
            totalPrice: (amount / 100), 
            order,
            razorpay_key: process.env.RAZORPAY_KEY_ID 
        });

    } catch (err) {
        console.error("Razorpay Error:", err);
        req.flash("error", "Something went wrong with the payment setup.");
        res.redirect("back");
    }
});

router.post("/verify-payment", isLoggedIn, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest("hex");

        if (generated_signature === razorpay_signature) {
            req.flash("success", "Payment Successful! Your stay is confirmed.");
            res.json({ status: "success" });
        } else {
            res.status(400).json({ status: "failure", message: "Invalid Signature" });
        }
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;