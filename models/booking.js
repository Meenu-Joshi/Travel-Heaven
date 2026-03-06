const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    totalPrice: Number,
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    guest: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Pending", "Confirmed"], default: "Pending" }
});

module.exports = mongoose.model("Booking", bookingSchema);