if(process.env.Node_ENV !="production"){
    require('dotenv').config();
}
console.log(process.env.SECRET);

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
var methodOverride = require('method-override');
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const listingRouter=require("./router/listing.js");
const reviewRouter=require("./router/reviews.js");
const userRouter=require("./router/user.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");




// let Mongo_url="mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;
main().then((res)=>{
    console.log("connection successfull");
}).catch((err)=>{
    console.log("error",err);
})

const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
  });
  

store.on("error",()=>{
    console.log("error on mongo session");
})
let sessionOptions={
    store,
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true
 }
}


async function main(){
    await mongoose.connect(dbUrl);
}

// app.get("/",(req,res)=>{
    
//     console.log("Root is working");
// }); 




app.set("views",path.join(__dirname,"/views"));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





app.use((req,res,next)=>{
    res.locals.successMsg=req.flash("success");
    res.locals.errorMsg=req.flash("error");
    res.locals.currUser=req.user;
    next();
    
});



app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);





 
 app.use((err,req,res,next)=>{
   
    let{status=500,message="something went wrong"}=err;
    console.log(err);
    
    res.render("listing/error.ejs",{err});
    next(err);
});


app.get('/', (req, res) => {
    res.send('Welcome to WanderLust!');
});


app.use("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
 })

app.listen("8080",()=>{
    console.log("port connected");
});