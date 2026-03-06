// controllers/bookings.js
const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.renderBookingForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    
    res.render("listing/book.ejs", { listing });
};

module.exports.createBooking = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    
    let newBooking = new Booking(req.body.booking);
    newBooking.guest = req.user._id; // Assign the logged-in user
    newBooking.listing = listing._id;
    
    listing.bookings.push(newBooking);
    
    await newBooking.save();
    await listing.save();
    
    req.flash("success", "Booking Successful!");
    res.redirect(`/listings/${listing._id}`);
};