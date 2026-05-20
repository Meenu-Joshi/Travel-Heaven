const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    totalPrice: Number,
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    guest: { type: Schema.Types.ObjectId, ref: "User" },
    
    // UPDATED: Added "Completed" to the enum options
    status: { 
        type: String, 
        enum: ["Pending", "Confirmed", "Completed"], 
        default: "Pending" 
    },
    
    // NEW: Field to capture the payment gateway's unique transaction hash
    transactionId: { 
        type: String, 
        default: "N/A" 
    },
    razorpay_order_id: { type: String, required: true }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model("Booking", bookingSchema);