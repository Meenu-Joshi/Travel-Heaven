
const mongoose=require("mongoose");
let schema=mongoose.Schema;

const listingSchema=new schema({
    title:{
        type:String,
        required:true
    },
    description:String,
   image:{
    url:{
        type:String
    },
    filename:{
        type:String
    }
    },
    price:Number,
    location:String,
    country:String,
    reviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Review"
        },
    ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"    
    }

}
)

const Listing=mongoose.model("listing",listingSchema);
module.exports=Listing;