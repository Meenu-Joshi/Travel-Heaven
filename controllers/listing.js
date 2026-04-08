const Listing=require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async (req,res)=>{
    const listings= await Listing.find({});
    res.render("listing/index.ejs",{listings});
   
};
module.exports.renderNewListing=(req,res)=>{
    res.render("listing/new.ejs");  
};
module.exports.createNewListing = async (req, res, next) => {
    // 1. Get coordinates from Mapbox based on the location entered in the form
    let response = await geocoder.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }).send();

    // 2. Create the new listing object
    const newListing = new Listing(req.body.listing);
    
    // 3. Save the geometry (coordinates) to the listing
    // response.body.features[0].geometry contains the GeoJSON 'Point'
    newListing.geometry = response.body.features[0].geometry;
    
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
// module.exports.showListing=async (req,res)=>{
//     let {id}=req.params;
//     const listing=await Listing.findById(id)
//        .populate({path:"reviews",
//         populate:{path:"author"}
//     })
//         .populate("owner");
//     if(!listing){
//         req.flash("error","listing doesn't exist")
//         res.redirect("/listings");
//     }
//     //   let originalImageUrl=listing.image.url;
//     //    originalImageUrl= originalImageUrl.replace("/upload","/upload/c_thumb/g_face/r_max");
//     //    console.log(originalImageUrl);
//        res.render("listing/show",{listing});

// };
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" },
        })
        .populate("owner"); // This line fixes your error 
    
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listing/show.ejs", { listing });
};
module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
    if(typeof req.file !== "undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save;    
    }
    
    res.render("listing/edit",{listing});
    
};
module.exports.editListing=async (req,res)=>{
    let editedListing=req.body.listing;
     let {id}=req.params;
     await Listing.findByIdAndUpdate(id,editedListing);
    req.flash("success","Listing updated");
    res.redirect(`/listings/${id}`);    
};
module.exports.destroyListing=async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing deleted");
    res.redirect("/listings");
}
