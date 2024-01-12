// reminderService.js
const schedule = require('node-schedule');
const transporter = require('./emailConfig');

function scheduleReminder(email, subject, message, date) {
  // Set up the scheduled reminder
  const job = schedule.scheduleJob(date, function () {
    // Send the email
    const mailOptions = {
      from: 'nehahimesh.10@gmail.com',
      to: email,
      subject: subject,
      text: message
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  });

  return job;
}

module.exports = { scheduleReminder };