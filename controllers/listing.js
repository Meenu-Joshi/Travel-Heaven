const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapToken });

// Helper function for the carbon footprint calculation
const calculateFootprint = (distanceKm, transportMode) => {
    const factors = {
        flight: 0.25,
        car: 0.15,
        train: 0.05
    };
    const factor = factors[transportMode] || 0.15;
    return (distanceKm * factor).toFixed(2);
};

module.exports.index = async (req, res) => {
    const listings = await Listing.find({});
    res.render("listing/index.ejs", { listings });
};

module.exports.renderNewListing = (req, res) => {
    res.render("listing/new.ejs");  
};

module.exports.createNewListing = async (req, res, next) => {
    if (!req.body.listing || !req.body.listing.location) {
        req.flash("error", "Location is required");
        return res.redirect("/listings/new");
    }

    // 1. Get coordinates from Mapbox based on the location entered in the form
    let response = await geocoder.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }).send();

    // 2. Create the new listing object
    const newListing = new Listing(req.body.listing);
    
    // 3. Save the geometry (coordinates) to the listing
    if (response.body.features.length > 0) {
        newListing.geometry = response.body.features[0].geometry;
    } else {
        newListing.geometry = { type: "Point", coordinates: [75.8, 30.9] }; // Default coordinates fallback
    }
    
    // 4. Set the owner and handle the image upload
    newListing.owner = req.user._id;
    
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        newListing.image = { url, filename };
    }
    
    // 5. Save to MongoDB Atlas and redirect
    await newListing.save();
    req.flash("success", "New listing added");
    res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews").populate("owner");
    
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Pass the token and the weather key from the .env to the EJS file
    res.render("listing/show.ejs", { 
        listing, 
        mapToken: process.env.MAPBOX_TOKEN,
        weatherApiKey: process.env.WEATHER_API_KEY 
    });
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    res.render("listing/edit.ejs", { listing });
};

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    
    // Update basic details
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    // If there is an uploaded image, save the new path
    if (typeof req.file !== "undefined") {
        let updatedListing = await Listing.findById(id);
        let url = req.file.path;
        let filename = req.file.filename;
        updatedListing.image = { url, filename };
        await updatedListing.save();    
    }
    
    req.flash("success", "Listing updated");
    req.session.save(() => {
        res.redirect(`/listings/${id}`);    
    });
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted");
    res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    
    // Update the record in MongoDB Atlas
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    // Handle image updates if a new file was uploaded
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();    
    }
    
    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/admin/dashboard`); // Redirect back to admin panel
};
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    
    // 1. Update text fields (this keeps the old image data initially)
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // 2. Only if a NEW file was chosen, update the Cloudinary data
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

