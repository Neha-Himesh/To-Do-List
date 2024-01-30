const EXPRESS              = require("express");
const APP                  = EXPRESS();
const BODY_PARSER          = require("body-parser");
const SESSION              = require("express-session");
const PASSPORT             = require("passport");
const TODO                 = require("./schema");
const { scheduleReminder } = require('./reminderService');
const DAYS                 = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; 
const MONTHS               = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var googleStrategy         = require("passport-google-oauth20").Strategy;
var todaysDate             = new Date();
var todaysDay              = DAYS[todaysDate.getDay()]; 
var todaysMonth            = MONTHS[todaysDate.getMonth()];
var dayOfMonth             = todaysDate.getDate(); 
var dateInRequiredForm     = `${todaysDay}, ${todaysMonth} ${dayOfMonth}`;
var workTitle              = "Today's Work To-do List";
var id                     = 1;

APP.use(EXPRESS.static("public"));
APP.set('view engine','ejs');
APP.use(BODY_PARSER.urlencoded({
	extended:true
}));
APP.use(SESSION({
	secret           : "Our little secret.",
	resave           : false,
	saveUninitialized: false
}));
APP.use(PASSPORT.initialize());
APP.use(PASSPORT.session());
APP.get("/",function(req,res){
		res.render("home.ejs");
	});
 

PASSPORT.use(TODO.createStrategy());
PASSPORT.serializeUser(function(user, cb) {
		process.nextTick(function() {
			return cb(null, {
				id      : user.id,
				username: user.username,
				picture : user.picture
			});
		});
	});
PASSPORT.deserializeUser(function(user, cb) {
		process.nextTick(function() {
			return cb(null, user);
		});
	});
PASSPORT.use(new googleStrategy({
		clientID      : process.env.CLIENT_ID,
		clientSecret  : process.env.CLIENT_SECRET,
		callbackURL   : "http://localhost:3000/auth/google/today",
		userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
	},
function(accessToken, refreshToken, profile, cb) {
		console.log(profile);
		TODO.findOrCreate({ username: profile.displayName, googleId: profile.id }, function (err, user) {
			return cb(err, user);
		});
	}
));
		
APP.get("/auth/google", PASSPORT.authenticate("google",{scope: ["profile"]}));
APP.get("/work",async function(req,res){
	if(req.isAuthenticated()){
			var workTaskList = await TODO.find({work_task_id: {$ne: null}});
			if(workTaskList){
				res.render("work",{workToDoTitle: workTitle, addedWorkTasks: workTaskList});
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
APP.post("/work", async function(req,res){
	var workTaskList = await TODO.find({work_task_id: {$ne: null}});
	if(workTaskList){
		res.render("work",{workToDoTitle: workTitle, addedWorkTasks: workTaskList});
	}
	else{
		console.log("Error");
	}
}
);
APP.get("/auth/google/today",PASSPORT.authenticate("google", { scope: ["profile"],failureRedirect: "/login" }),
	async function(req,res){
		var toDoDayList = await TODO.find({day_task_id: {$ne: null}});
		if(toDoDayList){
			 res.render("today",{displayDate: dateInRequiredForm, addedDayTasks: toDoDayList});
		}
		else{
			console.log("Error");
		}
	}
);
APP.get("/today",
	async function(req,res){
	 if(req.isAuthenticated()){  
		 var toDoDayList = await TODO.find({day_task_id: {$ne: null}});
		 if(toDoDayList){
			 res.render("today",{displayDate:  dateInRequiredForm, addedDayTasks: toDoDayList});
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
APP.get("/register",function(req,res){
	res.render("register.ejs");
});
APP.get("/login",function(req,res){
	res.render("login.ejs");
});
APP.post("/auth/google/today",PASSPORT.authenticate("google", { scope: ["profile"],failureRedirect: "/login" }),
	async function(req,res){
		var toDoDayList = await TODO.find({day_task_id: {$ne: null}});
		if(toDoDayList){
			res.render("today.ejs",{displayDate: dateInRequiredForm, addedDayTasks: toDoDayList});
		}
		else{
			console.log("Error");
		}
	}
);
APP.post("/new-work-task",async function(req,res){
	const newAddedWorkTask    = req.body["NewWorkTask"];
	const newAddedWorkTask_id = id;
	console.log(newAddedWorkTask_id);
	console.log(req.body["TaskTime"]);
	if(newAddedWorkTask == ""){
		console.log("Input field cannot be empty");
	}
	else{
		if(req.body.TaskTime != ""){
			const work_task_date_and_time = req.body["TaskTime"].split("T");
			const date                    = new Date(work_task_date_and_time[0]+" "+work_task_date_and_time[1]);
			console.log(date);
			const SystemDate = new Date();
			if (date.getTime() > SystemDate.getTime()){
				TODO.create(
					{
						username      : req.user.username,
						googleId      : req.user.googleId,
						work_task_id  : newAddedWorkTask_id,
						work_task     : newAddedWorkTask,
						work_task_date: work_task_date_and_time[0],
						work_task_time: work_task_date_and_time[1],
					}).then(()=>{
						const dateArray = work_task_date_and_time[0].split("-");
						const timeArray = work_task_date_and_time[1].split(": ");
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
		 TODO.create(
			 {
				 username    : req.user.username,
				 googleId    : req.user.googleId,
				 work_task_id: newAddedWorkTask_id,
				 work_task   : newAddedWorkTask,
			 }).then(()=>{
				 console.log("Work task inserted");
				 id++;
			 }).catch((err)=>{
				 console.log(err);
			 });  
		 } 
	}     
	var workTasks = await TODO.find({work_task_id: {$ne: null}});
	res.render("work.ejs",{workToDoTitle: workTitle, addedWorkTasks: workTasks});
});
APP.post("/new-day-task",async function(req,res){
	const newAddedDayTask    = req.body.NewDayTask;
	const newAddedDayTask_id = id;
	if(newAddedDayTask == ""){
		console.log("Input field cannot be empty");
	}
	else{
		if((req.body.TaskTime) != ""){
			const day_task_date_and_time = req.body.TaskTime.split("T");
			const date                   = new Date(day_task_date_and_time[0]+" "+day_task_date_and_time[1]);
			console.log(date);
			const SystemDate=new Date();
	 
			if (date.getTime() > SystemDate.getTime()){
				TODO.create(
					{
						username     : req.user.username,
						googleId     : req.user.googleId,
						day_task_id  : newAddedDayTask_id,
						day_task     : newAddedDayTask,
						day_task_date: day_task_date_and_time[0],
						day_task_time: day_task_date_and_time[1],
					}).then(()=>{
						const dateArray = day_task_date_and_time[0].split("-");
						const timeArray = day_task_date_and_time[1].split(": ");
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
			TODO.create(
				{
					username   : req.user.username,
					googleId   : req.user.googleId,
					day_task_id: newAddedDayTask_id,
					day_task   : newAddedDayTask,
				}).then(()=>{
					console.log("Day task inserted");
					id++;
				}).catch((err)=>{
					console.log(err);
				});
	 }
	} 
	var dayTasks = await TODO.find({day_task_id: {$ne: null}});
	res.render("today.ejs",{displayDate: dateInRequiredForm,addedDayTasks: dayTasks});
});
APP.post("/auth/google/today/delete-today-value",async (req,res)=>{
	const deletedLabel = req.body.day_task;
	console.log(deletedLabel);
	try{
		const result = await TODO.deleteOne({day_task: deletedLabel});
		if(result.deletedCount == 1){
			var toDoDayList = await TODO.find({day_task_id: {$ne: null}});
			if(toDoDayList){
				res.status(200).send({displayDate: dateInRequiredForm, addedDayTasks: toDoDayList});
			}
			 else{
				console.log("Error");
			}
		}
		else{
			res.status(404).json({error: "Today Task not deleted"});
		}
	}
	catch(error){
		console.error(error);
		res.status(500).json({error: 'Internal Server Error'});
	}
});  
APP.post("/work/delete-work-value",async (req,res)=>{
	const deletedLabel = req.body.work_task;
	console.log(deletedLabel);
	try{
		const result = await TODO.deleteOne({work_task: deletedLabel});
		if(result.deletedCount == 1){
			var toDoWorkList = await TODO.find({work_task_id: {$ne: null}});
			if(toDoWorkList){
				res.status(200).send({displayDate : dateInRequiredForm,addedWorkTasks: toDoWorkList});
			}
			else{
				console.log("Error");
			}
		}
		else{
			res.status(404).json({error: "Work Task not deleted"});
		}
	}
	catch(error){
		console.error(error);
		res.status(500).json({error:  'Internal Server Error'});
	}
});
APP.post("strike-todaysDay",(req,res)=>{
	res.render("today.ejs",{displayDate: dateInRequiredForm, addedDayTasks: dayTasks})
	console.log(req.body);
});

APP.post('/logout', function(req, res, next){
	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});

module.exports = APP;