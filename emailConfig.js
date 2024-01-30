const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth   : {
			user : process.env.user,
			pass : process.env.pass,
		},
		secure : true, // use SSL
		port   : 465, // port for secure SMTP  
});
	
module.exports = transporter;