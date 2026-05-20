const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const WrapAsync = require("../utils/Wrapasync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// 1. Search Route
router.get("/search", WrapAsync(async (req, res) => {
    let { q } = req.query;
    const allListings = await Listing.find({
        $or: [
            { title: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } }
        ]
    });
    if (allListings.length === 0) {
        req.flash("error", "No destinations found!");
        return res.redirect("/listings");
    }
    res.render("listing/index.ejs", { listings: allListings }); 
}));

// 2. Base Routes
router.route("/")
    .get(WrapAsync(listingController.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateListing, WrapAsync(listingController.createNewListing));

router.get("/new", isLoggedIn, listingController.renderNewListing);

// 3. ID Routes
router.route("/:id")
    .get(WrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, WrapAsync(listingController.editListing));

router.get("/:id/edit", isLoggedIn, isOwner, WrapAsync(listingController.renderEditForm));
router.delete("/:id", isLoggedIn, WrapAsync(listingController.destroyListing));
module.exports = router;