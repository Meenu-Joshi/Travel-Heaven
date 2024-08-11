const Listing=require("../models/listing.js");

module.exports.index=async (req,res)=>{
    const listings= await Listing.find({});
    res.render("listing/index.ejs",{listings});
   
};
module.exports.renderNewListing=(req,res)=>{
    res.render("listing/new.ejs");  
};
module.exports.createNewListing=async (req,res,next)=>{
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing=new Listing(req.body.listing);
    newListing.owner=req.user._id;
    newListing.image={url,filename};
    await newListing.save();
    req.flash("success","New listing added");
    res.redirect("/listings");
};
module.exports.showListing=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
       .populate({path:"reviews",
        populate:{path:"author"}
    })
        .populate("owner");
    if(!listing){
        req.flash("error","listing doesn't exist")
        res.redirect("/listings");
    }
    //   let originalImageUrl=listing.image.url;
    //    originalImageUrl= originalImageUrl.replace("/upload","/upload/c_thumb/g_face/r_max");
    //    console.log(originalImageUrl);
       res.render("listing/show",{listing});

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
