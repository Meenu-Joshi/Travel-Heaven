const express = require("express");
const router = express.Router();
const User = require("../models/user.js"); // Only one declaration needed
const Wrapasync = require("../utils/Wrapasync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { isLoggedIn } = require("../middleware.js");

// --- Existing Routes ---
router.route("/signup")
    .get(userController.renderSignupForm)
    .post(Wrapasync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl,
        passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }),
        Wrapasync(userController.login));

router.get("/logout", userController.logout);

// --- Forgot Password Routes ---

// 1. Render Forgot Form
router.get("/forgot", (req, res) => {
    res.render("users/forgot.ejs"); // Ensure this file exists
});

// 2. Handle Forgot Logic
router.post("/forgot", Wrapasync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        req.flash("error", "No account with that email address exists.");
        return res.redirect("/forgot");
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER, // Set this in .env
            pass: process.env.EMAIL_PASS, // Set this in .env
        },
    });

    const mailOptions = {
        to: user.email,
        from: "Wanderlust Support",
        subject: "Wanderlust Password Reset",
        text: `You requested a password reset. Please click the link below:\n\n
               http://${req.headers.host}/reset/${token}\n\n
               If you did not request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);
    req.flash("success", `An e-mail has been sent to ${user.email} with further instructions.`);
    res.redirect("/forgot");
}));

// 3. Render Reset Form
router.get("/reset/:token", Wrapasync(async (req, res) => {
    const user = await User.findOne({ 
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
    }
    res.render("users/reset.ejs", { token: req.params.token });
}));

// 4. Handle Reset Submission
router.post("/reset/:token", Wrapasync(async (req, res) => {
    const user = await User.findOne({ 
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("back");
    }

    // Set the new password using passport-local-mongoose method
    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash("success", "Success! Your password has been changed.");
    res.redirect("/login");
}));

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// router/user.js
router.get("/verify/:type", isLoggedIn, userController.sendOTP);
router.post("/verify/:type", isLoggedIn, userController.verifyOTP);
module.exports = router;