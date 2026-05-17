const User=require("../models/user.js");

module.exports.renderSignupForm=(req,res)=>{
    res.render("users/signup.ejs");
};

// controllers/user.js
module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password, phone } = req.body;
        // 1. Create user with phone number
        const newUser = new User({ email, username, phone }); 
        const registeredUser = await User.register(newUser, password);
        
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            
            // 2. Instead of going to /listings, go to the verification trigger
            // This will automatically call your sendOTP logic
            res.redirect("/verify/email"); 
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm=(req,res)=>{
    res.render("users/login.ejs")
}

module.exports.login= async(req,res)=>{
    req.flash("success","Welcome Back!");
    if(res.locals.redirect){
        return res.redirect(res.locals.redirect);
    }
    
    return res.redirect("/listings")
    };

module.exports.logout=(req,res)=>{
    req.logout((err)=>{
     if(err){
         next(err);
     }
     req.flash("success","you have logged out");
     res.redirect("/listings");
    })
 }

 
const crypto = require("crypto"); // Built-in Node module

module.exports.sendResetEmail = async (req, res) => {
    const token = crypto.randomBytes(20).toString('hex'); // Create a random string
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        req.flash("error", "No account with that email address exists.");
        return res.redirect("/forgot");
    }

    // Save the token and expiry (1 hour) to the database
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 

    await user.save(); // CRITICAL: If you miss this, the reset won't work!

    // Now send your email using nodemailer including the token in the URL
};

// From your current user.js
module.exports.resetPassword = async (req, res) => {
    let { token } = req.params;
    let { password } = req.body;

    let user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
    }

    await user.setPassword(password); // Hashing via passport-local-mongoose
    user.resetPasswordToken = token;
user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now


    await user.save(); // Pushes the new hash to MongoDB

    req.login(user, (err) => {
        if (err) return next(err);
        req.flash("success", "Password updated successfully!");
        res.redirect("/listings");
    });
};
const nodemailer = require("nodemailer");
const twilio = require("twilio")(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports.sendOTP = async (req, res) => {
    const { type } = req.params; // 'email' or 'phone'
    const otp = generateOTP();
    const user = await User.findById(req.user._id);

    user.otpCode = otp;
    user.otpExpires = Date.now() + 300000; // Valid for 5 mins
    await user.save();

    if (type === "email") {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
            to: user.email,
            subject: "Your Verification Code",
            text: `Your OTP is: ${otp}`
        });
    } else if (type === "phone") {
        await twilio.messages.create({
            body: `Your ExploreVista OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE,
            to: user.phone
        });
    }
    res.render("users/verify.ejs", { type });
};

module.exports.verifyOTP = async (req, res) => {
    const { otp } = req.body;
    const { type } = req.params;
    const user = await User.findById(req.user._id);

    if (user.otpCode === otp && user.otpExpires > Date.now()) {
        if (type === "email") user.isEmailVerified = true;
        if (type === "phone") user.isPhoneVerified = true;
        
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();
        
        req.flash("success", `${type} verified successfully!`);
        res.redirect("/listings");
    } else {
        req.flash("error", "Invalid or expired OTP.");
        res.redirect("back");
    }
};