const express=require("express");
const router=express.Router();
const Listing=require("../models/listing");
const WrapAsync = require("../utils/Wrapasync.js");
const {isLoggedIn, isOwner,validateListing}=require("../middleware.js");
const listingController=require("../controllers/listing.js");
const multer  = require('multer')
const {storage}=require("../cloudConfig.js");
const upload = multer({storage});


router.route("/")
.get(WrapAsync(listingController.index))
.post(isLoggedIn,upload.single('listing[image]'),validateListing,WrapAsync(listingController.createNewListing));
 
//New Route
router.get("/new",isLoggedIn,listingController.renderNewListing);

router.route("/:id")
.get(WrapAsync(listingController.showListing))
.put(isLoggedIn,isOwner,upload.single('listing[image]'),validateListing,WrapAsync(listingController.editListing));

// Edit Route
router.get("/:id/edit",isLoggedIn,isOwner,WrapAsync(listingController.renderEditForm));

//delete route
router.delete("/:id/delete",isOwner,isLoggedIn,WrapAsync(listingController.destroyListing));


module.exports=router;