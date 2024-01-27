require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs        = require("ejs");
const mongoose   = require("mongoose");
const session    = require("express-session");
const passport   = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var googleStrategy          = require("passport-google-oauth20").Strategy;
var findOrCreate            = require("mongoose-findorcreate");
const { scheduleReminder }  = require('./reminderService');

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended:true }));
app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://127.0.0.1:27017/ToDoList");

// register the schema in a new file

passport.use(toDo.createStrategy());
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});


passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new googleStrategy({
    clientID      : process.env.CLIENT_ID,
    clientSecret  : process.env.CLIENT_SECRET,
    callbackURL   : "http : //localhost: 3000/auth/google/today",
    userProfileURL: "https: //www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        toDo.findOrCreate({ username: profile.displayName,googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// these are constants, move it to the top of the file.
// Constant variables should be CAPITALS_ONLY. 
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; 
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// terrible variable name
const d = new Date();
let day = days[d.getDay()]; 
let month = months[d.getMonth()];
const date = d.getDate(); 
// var dateInRequiredForm = day+", "+month+" "+date;
var dateInRequiredForm = `${data} ${month} ${date}` // use string interpolation
var workTitle = "Today's Work To-do List";
var id = 1;

// Move all the routes outside of here in a separate file and import that file here.

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
}); 