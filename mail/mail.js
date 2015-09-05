/*

	HELPER FILE
	Contains functions for common mailing tasks

*/

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport();

var fromEmail = "admin@yoursite.com";
var toEmail = "yourname@gmail.com"; //where you want to receive these notifications
var siteName = "Tofu"; //your site name here

//email upon signing up
var emailWelcome = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'WELCOME!',
		text: 'You have joined ' + siteName + '.'
	});

};

//user creation
var emailNewUser = function(displayName) {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'A NEW USER HAS JOINED!',
		text: 'A new user by the name of ' + displayName + ' has joined!'
	});
};

//health check
var emailHealthCheck = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'HEALTH CHECK | ' + siteName,
		text: 'This is the bi-daily healthcheck.'
	});
};

//new item
var emailNewItem = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'New Item Posted!',
		text: 'A new item has been posted!'
	});
};

var emailNewNotification = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'New Notification!',
		text: 'A new notification has been sent.'
	});
};

var emailNewQuestion = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'New Question Asked!',
		text: 'Someone has asked a new question.'
	});
};

var emailItemRemoved = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'An item has been removed!',
		text: 'Someone has just removed an item.'
	});
};

var emailItemUpdated = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: siteName + ' | An item has been updated',
		text: 'An item has been updated.'
	});
};

var emailNewComment = function() {

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'NEW COMMENT!',
		text: 'A new comment has been submitted.'
	});
};

var emailNewUniqueIP = function(){

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'NEW UNIQUE IP',
		text: 'Someone new has just hit ' + stieName + '.'
	});
};

var emailNewImage = function(){

	transporter.sendMail({
		from: fromEmail,
		to: toEmail,
		subject: 'NEW IMAGE UPLOADED',
		text: 'Someone has just uploaded a new image to ' + siteName + '.'
	});
};

//export
exports.welcome = emailWelcome;
exports.newUser = emailNewUser;
exports.healthCheck = emailHealthCheck;
exports.newItem = emailNewItem;
exports.newNotification = emailNewNotification;
exports.newQuestion = emailNewQuestion;
exports.itemRemoved = emailItemRemoved;
exports.itemUpdated = emailItemUpdated;
exports.newComment = emailNewComment;
exports.newUniqueIP = emailNewUniqueIP;
exports.newImage = emailNewImage;
