const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    totalPrice: Number,
    guest: { type: Schema.Types.ObjectId, ref: "User" },
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);