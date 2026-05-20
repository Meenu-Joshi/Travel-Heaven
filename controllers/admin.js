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



// Toggle Role Controller
// Toggle Role Controller
module.exports.toggleRole = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect('/admin');
        }

        user.isAdmin = !user.isAdmin;
        await user.save();

        req.flash("success", `Updated role for ${user.username} successfully!`);
        res.redirect('/admin'); 
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to change user role.");
        res.redirect('/admin');
    }
};

// Delete User Controller
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        
        req.flash("success", "User deleted successfully!");
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to delete user.");
        res.redirect('/admin');
    }
};

// Delete User Controller
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
};