const Listing = require("../models/listing");
const User = require("../models/user");
const Booking = require("../models/booking");

module.exports.renderDashboard = async (req, res) => {
    // 1. Fetch Listings and populate owners for the display
    const listings = await Listing.find({}).populate("owner");
    
    // 2. Fetch Users for management
    const users = await User.find({});
    
    // 3. Fetch Bookings and use 'guest' to match your schema
    const bookings = await Booking.find({})
        .populate("listing")
        .populate("guest"); 
    
    res.render("admin/admin.ejs", { listings, users, bookings });
};