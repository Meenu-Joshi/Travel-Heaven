
const mongoose=require("mongoose");
const schema=mongoose.Schema;

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
    },
    bookings: [
        {
            type: mongoose.Schema.Types.ObjectId, // Now this will work!
            ref: "Booking",
        }
    ],
    geometry: {
    type: {
        type: String,
        enum: ['Point'], // Must be 'Point'
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    }
},

}
)

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;