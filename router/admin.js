const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const { isLoggedIn, isAdmin } = require("../middleware.js");

// 1. ADD THIS LINE TO IMPORT THE USER MODEL
const User = require("../models/user"); 
const Listing = require("../models/listing");

// If you have a route here instead of the controller, make sure it looks like this:
router.get("/dashboard", isLoggedIn, isAdmin, adminController.renderDashboard);
// In your router file (e.g., routes/admin.js):
// Matches: PUT /admin/users/:id/toggle-role
router.put('/users/:id/toggle-role', adminController.toggleRole);

// Matches: DELETE /admin/users/:id
router.delete('/users/:id', adminController.deleteUser);
module.exports = router;