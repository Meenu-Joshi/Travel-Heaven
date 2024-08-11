const User=require("../models/user.js");

module.exports.renderSignupForm=(req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.signup=async (req,res)=>{
    try{
    let {username,email,password}=req.body;
    const newUser=new User({email,username});
    let registeredUser=await User.register(newUser,password);
    
    req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Congrats! your account is created succesfully.");
        res.redirect("/listings");
    })
   
    }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");

    }
   
}

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