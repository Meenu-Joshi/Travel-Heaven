const express=require("express");
const router=express.Router({mergeParams: true});
const Listing=require("../models/listing");
const WrapAsync = require("../utils/Wrapasync.js");
const Review=require("../models/review.js");
const Wrapasync=require('../utils/Wrapasync.js');
const {validateReview,isLoggedIn, isAuthor}=require("../middleware.js");
const reviewController=require("../controllers/review.js")

//post review route
router.post("/",isLoggedIn,validateReview,WrapAsync(reviewController.postReview));
 
 //delete review route
 router.delete("/:reviewId",isLoggedIn,isAuthor,Wrapasync(reviewController.destroyReview));

 module.exports=router;