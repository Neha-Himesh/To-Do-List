const MONGOOSE                = require("mongoose");
const PASSPORT_LOCAL_MONGOOSE = require("passport-local-mongoose");
var findOrCreate              = require("mongoose-findorcreate");

MONGOOSE.connect("mongodb://127.0.0.1:27017/ToDoList");

const TODOSCHEMA = new MONGOOSE.Schema({
  username       : {
    type         : String,
    required     : true,
  },
  email          : String,
  password       : String,
  googleId       : String,
  facebookId     : String,
  work_task_id   : String,
  work_task      : String,
  day_task_id    : String,
  day_task       : String,
  day_task_time  : String,
  day_task_date  : String,
  work_task_time : String,
  work_task_date : String
});

TODOSCHEMA.plugin(PASSPORT_LOCAL_MONGOOSE);
TODOSCHEMA.plugin(findOrCreate);

const TODO=new MONGOOSE.model("TODO",TODOSCHEMA); 

module.exports=TODO;