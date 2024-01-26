const express=require("express");
require('dotenv').config();
const bodyParser= require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
var googleStrategy = require("passport-google-oauth20").Strategy;
var findOrCreate = require("mongoose-findorcreate");
const { scheduleReminder } = require('./reminderService');
const app = express();
const port = 3000;
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(session({
  secret:"Our little secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://127.0.0.1:27017/ToDoList");
const toDoSchema=new mongoose.Schema({
  username:{
    type:String,
    required: true,
  },
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  work_task_id:String,
  work_task:String,
  day_task_id:String,
  day_task:String,
  day_task_time:String,
  day_task_date:String,
  work_task_time:String,
  work_task_date:String
});
toDoSchema.plugin(passportLocalMongoose);
toDoSchema.plugin(findOrCreate);
const toDo=new mongoose.model("toDo",toDoSchema);
passport.use(toDo.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
passport.use(new googleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL:"http://localhost:3000/auth/google/today",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  toDo.findOrCreate({ username: profile.displayName,googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; 
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const d = new Date();
let day = days[d.getDay()]; 
let month = months[d.getMonth()];
const date = d.getDate(); 
var dateInRequiredForm= day+", "+month+" "+date;
var workTitle= "Today's Work To-do List";
var id=1;
app.get("/",function(req,res){
  res.render("home.ejs");
});
app.get("/auth/google", passport.authenticate("google",{scope: ["profile"]}));
app.get("/work",async function(req,res){
  if(req.isAuthenticated()){
      var workTaskList= await toDo.find({work_task_id:{$ne: null}});
      if(workTaskList){
        res.render("work",{workToDoTitle: workTitle,addedWorkTasks: workTaskList});
      }
      else{
        console.log("Error");
     }
  }
  else{
      res.redirect("/login");
  }
}
);  
app.post("/work", async function(req,res){
  var workTaskList= await toDo.find({work_task_id:{$ne: null}});
  if(workTaskList){
    res.render("work",{workToDoTitle: workTitle,addedWorkTasks: workTaskList});
  }
  else{
    console.log("Error");
  }
}
);
app.get("/auth/google/today",passport.authenticate("google", { scope: ["profile"],failureRedirect: "/login" }),
  async function(req,res){
    var toDoDayList=await toDo.find({day_task_id:{$ne: null}});
    if(toDoDayList){
       res.render("today",{displayDate : dateInRequiredForm,addedDayTasks: toDoDayList});
    }
    else{
      console.log("Error");
    }
  }
);
app.get("/today",
  async function(req,res){
   if(req.isAuthenticated()){  
     var toDoDayList=await toDo.find({day_task_id:{$ne: null}});
     if(toDoDayList){
       res.render("today",{displayDate : dateInRequiredForm,addedDayTasks: toDoDayList});
     }
     else{
      console.log("Error");
     }
   }
   else{
     res.redirect("/login");
   }
 }
);
app.get("/register",function(req,res){
  res.render("register.ejs");
});
app.get("/login",function(req,res){
  res.render("login.ejs");
});
app.post("/auth/google/today",passport.authenticate("google", { scope: ["profile"],failureRedirect: "/login" }),
  async function(req,res){
    var toDoDayList=await toDo.find({day_task_id:{$ne: null}});
    if(toDoDayList){
      res.render("today.ejs",{displayDate : dateInRequiredForm,addedDayTasks: toDoDayList});
    }
    else{
      console.log("Error");
    }
  }
);
app.post("/new-work-task",async function(req,res){
  const newAddedWorkTask=req.body["NewWorkTask"];
  const newAddedWorkTask_id=id;
  console.log(newAddedWorkTask_id);
  console.log(req.body["TaskTime"]);
  if(newAddedWorkTask==""){
    console.log("Input field cannot be empty");
  }
  else{
    if(req.body["TaskTime"]!=""){
      const work_task_date_and_time=req.body["TaskTime"].split("T");
      const date=new Date(work_task_date_and_time[0]+" "+work_task_date_and_time[1]);
      console.log(date);
      const SystemDate=new Date();
      if (date.getTime() > SystemDate.getTime()){
        toDo.create(
          {
            username: req.user.username,
            googleId:req.user.googleId,
            work_task_id:newAddedWorkTask_id,
            work_task: newAddedWorkTask,
            work_task_date:work_task_date_and_time[0],
            work_task_time:work_task_date_and_time[1],
          }).then(()=>{
            const dateArray=work_task_date_and_time[0].split("-");
            const timeArray=work_task_date_and_time[1].split(":");
            console.log("Work task inserted");
            const reminderJob = scheduleReminder(
              'nehahimesh.10@gmail.com',
              newAddedWorkTask,
              'This is your reminder message! Ignore if the task is already done',
              new Date(dateArray[0], dateArray[1]-1, dateArray[2],  timeArray[0], timeArray[1], 0)
             );      
            console.log(work_task_date_and_time);
            console.log('Reminder scheduled:', reminderJob);
            id++;
            }).catch((err)=>{
              console.log(err);
            }); 
      }
      else {
        console.log("The task couldnt be added as the time mentioned is not future time");
      }        
   } 
   else{
     toDo.create(
       {
         username: req.user.username,
         googleId:req.user.googleId,
         work_task_id:newAddedWorkTask_id,
         work_task: newAddedWorkTask,
       }).then(()=>{
         console.log("Work task inserted");
         id++;
       }).catch((err)=>{
         console.log(err);
       });  
     } 
  }     
  var workTasks=await toDo.find({work_task_id:{$ne:null}});
  res.render("work.ejs",{workToDoTitle : workTitle,addedWorkTasks: workTasks});
});
app.post("/new-day-task",async function(req,res){
  const newAddedDayTask=req.body["NewDayTask"];
  const newAddedDayTask_id=id;
  if(newAddedDayTask==""){
    console.log("Input field cannot be empty");
  }
  else{
    if(req.body["TaskTime"]!=""){
      const day_task_date_and_time=req.body["TaskTime"].split("T");
      const date=new Date(day_task_date_and_time[0]+" "+day_task_date_and_time[1]);
      console.log(date);
      const SystemDate=new Date();
   
      if (date.getTime() > SystemDate.getTime()){
        toDo.create(
          {
            username: req.user.username,
            googleId:req.user.googleId,
            day_task_id:newAddedDayTask_id,
            day_task: newAddedDayTask,
            day_task_date:day_task_date_and_time[0],
            day_task_time:day_task_date_and_time[1],
          }).then(()=>{
            const dateArray=day_task_date_and_time[0].split("-");
            const timeArray=day_task_date_and_time[1].split(":");
            console.log("Day task inserted");
            const reminderJob = scheduleReminder(
             'nehahimesh.10@gmail.com',
              newAddedDayTask,
             'This is your reminder message! Ignore if the task is already done',
              new Date(dateArray[0], dateArray[1]-1, dateArray[2],  timeArray[0], timeArray[1], 0)
            );
            console.log(day_task_date_and_time);
            console.log('Reminder scheduled:', reminderJob);
            id++;
          }).catch((err)=>{
            console.log(err);
          });
      } 
      else {
        console.log("The task couldnt be added as the time mentioned is not future time");
      }
    } 
    else{
      toDo.create(
        {
          username: req.user.username,
          googleId:req.user.googleId,
          day_task_id:newAddedDayTask_id,
          day_task: newAddedDayTask,
        }).then(()=>{
          console.log("Day task inserted");
          id++;
        }).catch((err)=>{
          console.log(err);
        });
   }
  } 
  var dayTasks=await toDo.find({day_task_id:{$ne:null}});
  res.render("today.ejs",{displayDate : dateInRequiredForm,addedDayTasks: dayTasks});
});
app.post("/auth/google/today/delete-today-value",async (req,res)=>{
  const deletedLabel=req.body.day_task;
  console.log(deletedLabel);
  try{
    const result=await toDo.deleteOne({day_task: deletedLabel});
    if(result.deletedCount==1){
      var toDoDayList=await toDo.find({day_task_id:{$ne: null}});
      if(toDoDayList){
        res.status(200).send({displayDate : dateInRequiredForm,addedDayTasks: toDoDayList});
      }
       else{
        console.log("Error");
      }
    }
    else{
      res.status(404).json({error:"Today Task not deleted"});
    }
  }
  catch(error){
    console.error(error);
    res.status(500).json({error:'Internal Server Error'});
  }
});  
app.post("/work/delete-work-value",async (req,res)=>{
  const deletedLabel=req.body.work_task;
  console.log(deletedLabel);
  try{
    const result=await toDo.deleteOne({work_task: deletedLabel});
    if(result.deletedCount==1){
      var toDoWorkList=await toDo.find({work_task_id:{$ne: null}});
      if(toDoWorkList){
        res.status(200).send({displayDate : dateInRequiredForm,addedWorkTasks: toDoWorkList});
      }
      else{
        console.log("Error");
      }
    }
    else{
      res.status(404).json({error:"Work Task not deleted"});
    }
  }
  catch(error){
    console.error(error);
    res.status(500).json({error:'Internal Server Error'});
  }
});
app.post("strike-day",(req,res)=>{
  res.render("today.ejs",{displayDate : dateInRequiredForm,addedDayTasks: dayTasks})
  console.log(req.body);
});

app.post('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
}); 