require('dotenv').config(); 

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Models
const User = require("./models/user.js");

// Routers
const listingRouter = require("./router/listing.js");
const reviewRouter = require("./router/reviews.js");
const userRouter = require("./router/user.js");
const bookingRouter = require("./router/booking.js");
const chatbotRouter = require("./router/chatbot.js");
const adminRouter = require("./router/admin.js");
// Database Connection
const dbUrl = process.env.ATLASDB_URL;

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => console.log("Connection successful to Atlas DB"))
    .catch((err) => console.log("Database connection error:", err));

// Session & Store Configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "fallbacksecret",
    },
    touchAfter: 24 * 3600,
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

// Middlewares - Setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(methodOverride('_method'));

// Session and Flash must come before Passport
app.use(session(sessionOptions));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Variables Middleware (Must be AFTER Passport)
app.use((req, res, next) => {
    res.locals.currUser = req.user || null; // If req.user is undefined, set to null
    next();
});

app.use((req, res, next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currUser = req.user || null; // Fixes the "currUser is not defined" error
    next();
});

// --- Routes ---
app.get("/", (req, res) => {
    res.render("pages/home.ejs");
});

app.get("/privacy", (req, res) => {
    res.render("pages/privacy.ejs");
});

app.get("/terms", (req, res) => {
    res.render("pages/terms.ejs");
});


app.use("/listings", listingRouter); 
app.use("/listings/:id/bookings", bookingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/chatbot", chatbotRouter);
app.use("/", userRouter);

// FIX: Move the admin route ABOVE the 404 handler
app.use("/admin", adminRouter);

// 404 Error Handling (Must be the very last route)
app.all("*", (req, res, next) => {
    const ExpressError = require("./utils/ExpressError.js");
    next(new ExpressError(404, "Page Not Found!"));
});

// Generic Error Handler
app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong" } = err;
    res.status(status).render("listing/error.ejs", { err: message });
});

// Dynamic Port Binding for Render
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});