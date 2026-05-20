const Listing=require("./models/listing.js");
const Review=require("./models/review.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema}=require("./schema.js");
const {reviewSchema}=require("./schema.js");

module.exports.isLoggedIn=((req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","you must be login to create a new listing");
        return res.redirect("/login");
    }
    next();
});
 module.exports.saveRedirectUrl=(req,res,next)=>{
   if(req.session.redirectUrl){
    res.locals.redirect=req.session.redirectUrl;
   }  
   next();
 }

 

 module.exports.validateListing=(req,res,next)=>{
  let {error}=listingSchema.validate(req.body);
 
  if(error){
      let errMsg=error.details.map((el)=>el.message).join(",");
     throw new ExpressError(400,errMsg);
  }
  else{
      next();
  }
}

module.exports.validateReview=(req,res,next)=>{
  let {error}=reviewSchema.validate(req.body);
 
  if(error){
      let errMsg=error.details.map((el)=>el.message).join(",");
     throw new ExpressError(400,errMsg);
  }
  else{
      next();
  }
}
module.exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    req.flash("error", "You do not have permission to do that!");
    res.redirect("/listings");
};
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    
    if (!listing) {
        // If it's a fetch API request, send JSON instead of a flash redirect
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        req.flash("error", "Listing you are trying to access does not exist!");
        return res.redirect("/listings");
    }

    // FIX: Grant access if the current user is the owner OR an admin
    if (res.locals.currUser && (listing.owner.equals(res.locals.currUser._id) || res.locals.currUser.isAdmin)) {
        return next(); // Authorization successful, proceed to destroyListing controller!
    }

    // If neither condition is met, block them
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ success: false, message: "You do not have permission to do that." });
    }
    req.flash("error", "You do not have permission to perform this action!");
    return res.redirect(`/listings/${id}`);
};
module.exports.isAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    
    // Check if the user is NOT an admin AND NOT the author of the review
    if (!res.locals.currUser.isAdmin && !review.author._id.equals(res.locals.currUser._id)) {
        req.flash("error", "you didn't have access.");
        return res.redirect(`/listings/${id}`);
    }
    next();
};