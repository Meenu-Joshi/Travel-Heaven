const User=require("../models/user.js");

module.exports.renderSignupForm=(req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to ExploreVista!");
            res.redirect("/listings");
        });
    } catch (e) {
        // Check if the error is a duplicate email error
        if (e.code === 11000 || e.name === 'UserExistsError') {
            req.flash("error", "A user with that email or username already exists.");
            return res.redirect("/signup");
        }
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