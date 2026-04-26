require('dotenv').config(); // Load variables as the very first step

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

// Middlewares
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(methodOverride('_method'));

app.use(session(sessionOptions));
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currUser = req.user || null; // If req.user is undefined, set to null
    next();
});

app.use((req, res, next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// --- ROUTE ORDER ---
// This tells Express: any URL starting with /listings/ID/bookings 
// should be handled by the bookingRouter.

// app.use("/listings", bookingRouter); // Bookings first
app.use("/listings/:id/bookings", bookingRouter);
app.use("/listings", listingRouter); 
app.use("/listings/:id/reviews", reviewRouter);
app.use("/chatbot", chatbotRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
    const ExpressError = require("./utils/ExpressError.js");
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong" } = err;
    res.status(status).render("listing/error.ejs", { err: message });
});

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});