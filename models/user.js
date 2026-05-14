const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new Schema({
    email:{
        required:true,
        type:String,
        unique: true
    },
    phone: { type: String, unique: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    otpCode: String,
    otpExpires: Date,
 isAdmin: {
        type: Boolean,
        default: false // Most users will not be admins
    },
 resetPasswordToken: String,
  resetPasswordExpires: Date
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);



