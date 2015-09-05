var express = require('express');
var ObjectId = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');
var TwitterStrategy = require('passport-twitter');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var mongojs = require('mongojs');
var multer = require('multer');
var sha1 = require('sha1');
var gm = require('gm');
var nodemailer = require('nodemailer');

//config
var config = require('./config');

//mail
var mail = require('./mail/mail.js');

//newsletter
var newsletter = require('./newsletter/newsletter.js');

//referrals
var referrals = require('./referrals/referrals.js');

//mongodb uri
var mongouri = config.mongodb.uri;

//session setup
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});


//facebook passport config
passport.use(new FacebookStrategy( {
	clientID: config.appId,
	clientSecret: config.appSecret,
	callbackURL: config.callbackURL
//,	profileFields: ["id", "name", "first_name", "last_name", "link", "username", "gender", "locale", "age_range", "displayName", "photos", "emails"]
},
function (accessToken, refreshToken, profile, done) {
	process.nextTick(function () {

		console.log(profile.id, profile.emails, profile.displayName);

		var db = mongojs(config.mongodb.db);
		var collection = db.collection('users');

		//first find users
		collection.findOne( { fbuserid: profile.id }, function (err, docs) {
			console.log(docs);

			if (docs == null || docs.length == 0) {
				//create user
				console.log('Creating user...');

				collection.insert({ fbuserid: profile.id, name: profile.displayName, other: profile, created: new Date() }, function (err, details) {
						//associate _id with user session
						profile.tofuMarket_id = details._id;
						return done(null, profile);
					});

				//mail admin
				mail.newUser(profile.displayName);

			} else {
				console.log('Welcome back!');
				//associate _id with user session
				profile.tofuMarket_id = docs._id;
				return done(null, profile);
			}
		});
	});
}));

//twitter passport config
passport.use(new TwitterStrategy({
	consumerKey: config.twitter.consumerKey,
	consumerSecret: config.twitter.consumerSecret,
	callbackURL: config.twitter.callbackURL
},
function (accessToken, refreshToken, profile, done) {
	process.nextTick(function () {
		console.log(profile);
		
		var db = mongojs(config.mongodb.db);
		var collection = db.collection('users');

		//first find users
		collection.findOne( { twitter_userid: profile.id }, function (err, docs) {
			console.log(docs);

			if (docs == null || docs.length == 0) {
				//create user
				console.log('Creating user...');

				collection.insert({ twitter_userid: profile.id, name: profile.displayName, other: profile, created: new Date() }, function (err, details) {
						//associate _id with user session
						profile.tofuMarket_id = details._id;
						return done(null, profile);
					});

				//mail admin
				mail.newUser(profile.displayName);

			} else {
				console.log('Welcome back!');
				//associate _id with user session
				profile.tofuMarket_id = docs._id;
				return done(null, profile);
			}
		});
	});
}));

//google passport config
passport.use(new GoogleStrategy({
	clientID: config.google.clientID,
	clientSecret: config.google.clientSecret,
	callbackURL: config.google.callbackURL
},
function(accessToken, refreshToken, profile, done) {
	process.nextTick(function () {
		console.log(profile);
		
		var db = mongojs(config.mongodb.db);
		var collection = db.collection('users');

		//first find users
		collection.findOne( { google_userid: profile.id }, function (err, docs) {
			console.log(docs);

			if (docs == null || docs.length == 0) {
				//create user
				console.log('Creating user...');

				collection.insert({ google_userid: profile.id, name: profile.displayName, other: profile, created: new Date() }, function (err, details) {
						console.log(details);
						//associate _id with user session
						profile.tofuMarket_id = details._id;
						return done(null, profile);
					});

				//mail admin
				mail.newUser(profile.displayName);

			} else {
				console.log('Welcome back!');
				//associate _id with user session
				profile.tofuMarket_id = docs._id;
				return done(null, profile);
			}
		});
	});
}));


/*

	HELPING FUNCTIONS

*/

//capitlize function...for categories
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

//create ObjectId...check first
function createObjectId(string) {
	if (string.length == 24) {
		for (var i = 0; i < string.length; i++) {
			if (isNaN(parseInt(string.charAt(i), 16))) {
				return new ObjectId('000000000000000000000000');
			}

		return new ObjectId(string);
		}
}}

//generate login info at top of page
function generateLoginInfo(req) {
	var html = "";
	//check if authenticated through passport-facebook
	if (req.isAuthenticated()) {
		html = 'Logged in as ' + req.user.displayName + ' | <a href="/">Home</a> | <a href="/dashboard">Dashboard</a> | <a href="/sell">Sell</a> | <a href="/logout">Logout</a><p />';
	}
	else {
		html = 'Login (or signup) with <a href="/auth/facebook">Facebook</a>, <a href="/auth/google">Google</a>, or <a href="/auth/twitter">Twitter</a>. More <a href="/signup_info">information on signing up</a>.<p />';
	}

	return html;
}

//generate item page
function generateItemBody(results, objectId) {
	var html = ""
	html = html + '<br /><a href="/">Tofu Market</a> > <a href="category?id=' + results[0]['category'] + '">' + results[0]['category'] + '</a> >'
	html = html + '<h1>' + results[0]['title'];
	html = html + ' - $' + results[0]['price'] + '</h1>';
	if (typeof results[0]['images'][0] === 'string') {
		for (var i = 0; i < results[0]['images'].length; i++) {
			html = html + '<a href="img/' + results[0]['images'][i].slice(0,-4) + 'large.JPG">';
			html = html + '<img src="img/' + results[0]['images'][i].slice(0,-4) + 'thumbnail.JPG"></a>';
		}
	} else {
		for (var i = 0; i < results[0]['images'].length; i++) {
			html = html + '<a href="/uploads/' + results[0]['images'][i].filename + '" width="400">';
			html = html + '<img src="/uploads/thumb' + results[0]['images'][i].filename + '"" width="400"></a>';
		}
	}
	html = html + '<form action="/askquestion?id=' + objectId + '" method="post"><input type="submit" value="Ask Question" /></form><form action="/buy?id=' + objectId + '" method="post"><p /> <input type="submit" value="Purchase"></form><p />';
	html = html + '<div id="infotitle">Status:</div>' + capitalizeFirstLetter((results[0]['status'] ? results[0]['status'] : 'Available')) + '<p />';
	html = html + '<div id="infotitle">Description:</div>' + results[0]['description'] + '<p />';
	html = html + '<div id="infotitle">Seller:</div> <a href="/user?id=' + results[0]['seller_id'] + '">' + results[0]['seller_id'] + '</a><p />';
	html = html + '<div id="infotitle">Payment:</div>' + results[0]['payment'] + '<p />';
	html = html + '<div id="infotitle">Shipping:</div>' + results[0]['shipping'] + '<p />';
	html = html + '<div id="infotitle">Total:</div> $' + results[0]['price'] + ' + $' + results[0]['shipping_price'] + ' = $' + (results[0]['price'] + results[0]['shipping_price']);

	return html;
}

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
		res.redirect('/login')
}

/*

	APP SECTION

*/

/*
	HTML SNIPPETS
*/

//html head
var htmlHead = '<!DOCTYPE html>'
	+	'<html>'
	+	'<head>'
	+	'<title>Tofu Market | No fees.</title>'
	+	'<link rel="stylesheet" type="text/css" href="/style.css">'
	+	'<link rel="stylesheet" type="text/css" href="/basic.css">'
	+	'<script src="/libs/dropzone.js"></script>'
	+	'</head><body>';

var googleAnalytics = "<script>"
	+	"(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){"
  + "(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),"
  + "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)"
  + "})(window,document,'script','//www.google-analytics.com/analytics.js','ga');"
  + "ga('create', 'UA-56555470-2', 'auto');"
  + "ga('send', 'pageview');"
	+ "</script>";

htmlHead = htmlHead + googleAnalytics;

var facebookScript = "<script>"
	+ "window.fbAsyncInit = function() {"
	+ "FB.init({"
	+		"appId      : '1716002011959745',"
	+		"cookie			: true,"
	+		"xfbml      : true,"
	+		"version    : 'v2.2'"
	+	"});"
	+ "};"

	+ "function checkUser() {"
	+	"FB.api('/me', function(response) {"
	+	"});"
	+ "}"

	+ "(function(d, s, id){"
	+	"var js, fjs = d.getElementsByTagName(s)[0];"
	+	"if (d.getElementById(id)) {return;}"
	+	"js = d.createElement(s); js.id = id;"
	+	'js.src = "//connect.facebook.net/en_US/sdk.js";'
	+	"fjs.parentNode.insertBefore(js, fjs);"
	+ "}(document, 'script', 'facebook-jssdk'));"
+ "</script>";

var facebookLogin = "";

htmlHead = htmlHead + facebookScript + facebookLogin;

function generateHead(req) {
	var html = htmlHead + facebookScript + facebookLogin + generateLoginInfo(req);
	html = html + '<form action="/search" method="post">'
		+	'<input type="text" name="search_entry" /> '
		+	'<input type="submit" value="Search Tofu Market" />'
		+	'</form>';
	return html;
}

var htmlFoot = '<p /><hr><p />'
	+ '<div id="siteLinks"> <a href="/">Home</a> | <a href="/contact">Contact Us</a> | <a href="/faq">FAQ</a> | <a href="/about">About</a> | <a href="/howto">How To</a></div> <p />'
	+	'<i>Copyright Tofu Market, Pthirty-fourR</i></body></html>';


/*

	APP EXPRESS

*/
//server static files
var app = express()
	.use('/img', express.static(__dirname + '/items/img'))
	.use(express.static(__dirname + '/static'))
	.use('/libs',express.static(__dirname + '/libs'))
	.use('/uploads', express.static(__dirname + '/uploads'))
	.use(bodyParser())
	.use(cookieParser())
	.use(methodOverride())
	.use(session({ secret: "392309t320jgjwdzd090393"}))
	.use(passport.initialize())
	.use(passport.session());

/*

	FACEBOOK
	necessary app info for facebook auth

*/

// GET /auth/facebook

app.get('/auth/facebook',
	passport.authenticate('facebook'),
	function(req, res) {
		//redirected to facebook
});

// GET /auth/facebook/callback
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
});


/*

	TWITTER
	necessary app info for twitter auth

*/
// GET /auth/twitter
app.get('/auth/twitter',
	passport.authenticate('twitter'),
	function(req, res) {

});

//GET /auth/twitter/callback
app.get('/auth/twitter/callback',
	passport.authenticate('twitter', {failureRedirect: '/login' }),
	function (req, res) {
		res.redirect('/');
});

/*

	GOOGLE
	necessary app info for google auth

*/
// GET /auth/google
app.get('/auth/google',
	passport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.me https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'}),
	function(req, res) {

});

// GET /auth/google/callback
app.get('/auth/google/callback',
	passport.authenticate('google', {failureRedirect: '/login' }),
	function (req, res) {
		res.redirect('/');
});

/*

	SIGNUP INFORMATION

*/

app.get('/signup_info', function (req, res) {
	var html = "<h1>Tofu Market Signup.</h1>";

	html = html + 'We have three methods for account creation:<p >'
		+	'<ol>'
		+	'<li><a href="/auth/facebook">Facebook</a></li>'
		+	'<li><a href="/auth/google">Google</a></li>'
		+	'<li><a href="/auth/twitter">Twitter</a></li>'
		+	'</ol>'
		+	'Please choose whichever is easiest and most convenient for you! At the moment, only one per account can be used (we\'re working to allow multiple per tofuMarket account!). In addition to their ease of use, they also provide more security when logging into this site.';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

/*

	GENERAL LOGOUT

*/

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});


/*

	LOGIN
	stand-alone login page

*/

app.get('/account', ensureAuthenticated, function(req, res) {
	res.send('account: ' + req.user.tofuMarket_id + ' name:' + req.user.displayName);
});

app.get('/login', function(req, res) {
	var html = "<h1>Login</h1>"
	html = html + "We use Facebook, Google and Twitter for account authentication. <p /> Easy to use and secure. <p/>"
	html = html + 'Login with <a href="/auth/facebook">Facebook</a>, <a href="/auth/google">Google</a>, or <a href="/auth/twitter">Twitter</a>. <p />';
	res.send(htmlHead + html + htmlFoot);
});


/*

	SPLASH
	simple page to send new users

*/
app.get('/splash', function (req, res) {
	var html = '<h1>Splash</h1>';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

/*

	INDEX
	Main page generation

*/
app.get('/', function (req, res) {
	var db = mongojs(config.mongodb.db);

	var collection = db.collection('items');

	collection.find({},{title:1,price:1}).sort({_id: -1}).limit(30).toArray(function (err, results) {
		if (err) console.log('No results');
		console.log('Found results:', results);

		var html = "";
		html = html + '<h1>Tofu Market</h1>';//'<img src="title2.jpg"><p />';
		html = html + '<div class="fb-like"'
			+ 'data-share="true"'
			+ 'data-width="450"'
			+ 'data-show-faces="false">'
			+ "</div><p />";
		html = html + '<div id="alphainfo">'
			+	'<u>NOTICE:</u> This site is in alpha. Currently, you must be located in the United States to use Tofu Market. Feel free to <a href="/contact">contact us</a> if you have any thoughts, concerns, or issues.</div><p />';
		html = html + '<div id="subtitle">Categories:</div><p />';
		html = html + '<a href="category?id=Books">Books</a> | '
			+	'<a href="category?id=Coins">Coins</a> | '
			+	'<a href="category?id=Comics">Comics</a> | '
			+	'<a href="category?id=Games">Games</a> | '
			+	'<a href="category?id=Movies">Movies</a> | '
			+	'<a href="category?id=Music">Music</a> | '
			+	'<a href="category?id=Stamps">Stamps</a> | '
			+	'<a href="category?id=Toys">Toys</a><p />';
		html = html + '<div id="subtitle">Recent Items:</div><p />';
		if (!results) return;
		for (var i = 0; i < results.length; i++) {
			html = html + '<a href="item?id=' + results[i]['_id'] + '">' + results[i]['title'] + ' ($' + results[i]['price'] + ')</a>';
			html = html + '<br />';
		}

	page = generateHead(req) + html + htmlFoot;
	res.send(page);
	});
});


/*

	CATEGORY
	Display items based on category

*/
app.get('/category', function (req, res) {
	var db = mongojs(config.mongodb.db);

	var collection = db.collection('items');
	collection.find({ category: capitalizeFirstLetter(req.query.id) }).toArray(function (err, results) {
		if (err) console.log('No results');
		console.log('Found results:', results);

		var html = "";
		html = html + '<br /><a href="/">Tofu Market</a> >';
		html = html + '<h1>' + capitalizeFirstLetter(req.query.id) + '</h1>';
		//write out titles
		for (var i = 0; i < results.length; i++) {
			html = html + '<a href="item?id=' + results[i]['_id'] + '">' + results[i]['title'] + ' ($' + results[i]['price'] + ')</a>';
			html = html + '<br />';
		}

		page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});


/*

	ITEM
	Display specific item (by ObjectId)

*/
app.get('/item', function (req, res) {
	var db = mongojs(config.mongodb.db);

	var collection = db.collection('items');

	//check if id ObjectId.length=24; otherwise could break query...
	//must also be hex...
	//if (req.query.id.length == 24) {
	//}
	collection.find({ _id: createObjectId(req.query.id) }).toArray(function (err, results) {
		console.log('Found results:', results);
		var html = ""
		//make sure something was returned
		if (results[0]){
			html = html + generateItemBody(results,req.query.id);
		}
		else {
			html = 'No item with that id.';
		}
		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});


/*

	SELL

*/
//sell form
app.get('/sell', ensureAuthenticated, function(req, res) {

	var html = "<h1>List Item for Sale</h1>";

	//dropzone configuration
	html = html + "<script>"
		+	"Dropzone.options.myAwesomeDropzone = {"
		+	'maxFilesize: 1,' //mb
		+	'maxFiles: 4,'
		+	'acceptedFiles: "image/*"}'
		+	'</script>';

	var identifier = sha1(new String(Math.random()) + new String(new Date()));

	html = html + '<form action="/uploadimage?' + req.user.tofuMarket_id + '" class="dropzone dz-clickable" id="my-awesome-dropzone">'
	+	'<div class="dz-default dz-message">'
	+	'<input type="hidden" name="identifier" value="' + identifier + '" />'
	+	'<span>==================================<p />'
	+	'>> Click (or drop images) here to upload <<<p />'
	+	'==================================</span>'
	+	'</div></form>'
	+	'<input type="file" multiple="multiple" class="dz-hidden-input" style="visibility: hidden; possition: absolute; top:0px; height:0px; width:0px;">';

	html = html + 'Current max size per image: 1MB. <p /> <form action="/sell" method="post">'
	+	'<table><tr><td>'
  	+	'Title:</td><td>'
  	+	'<input type="text" name="title" /></td></tr><tr><td>'
  	+	'Category:</td><td>'
  	+	'<input type="text" name="category" /></td></tr><tr><td>'
  	+	'Description:</td><td>'
  	+	'<input type="text" name="description" /></td></tr><tr><td>'
  	+	'<input type="hidden" name="seller_id" value="' + req.user.tofuMarket_id + '"/></td></tr><tr><td>'
  	+	'Payment:</td><td>'
  	+	'<input type="text" name="payment" /></td></tr><tr><td>'
  	+	'Price ($):</td><td> '
  	+	'<input type="text" name="price" /></td></tr><tr><td>'
  	+	'Shipping Cost ($):</td><td>'
  	+	'<input type="text" name="shipping_price" /></td></tr><tr><td>'
  	+	'Shipping Info:</td><td>'
  	+	'<input type="text" name="shipping" /></td></tr><tr><td>'
  	+	'<input type="hidden" name="identifier" value="' + identifier + '" />'
  	+	'<p /><input type="submit" value="Sell Item" /></td></tr></table>'
	+	'</form>';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

//receive sell form information (item creation)
app.post('/sell', ensureAuthenticated, function(req, res) {

	var db = mongojs(config.mongodb.db);

	var collection = db.collection('images');

	//grab the file names of the images related to this item
	collection.find({ identifier: req.body.identifier }, { filename: 1, _id: 0 }, function(err, docs) {

		//var image_array = req.body.images.replace(" ", "").split(",");
		var image_array = docs;
		console.log(docs);

		var jsonObject = { title: req.body.title, category: req.body.category,
			description: req.body.description, seller_id: req.body.seller_id,
			payment: req.body.payment, price: parseFloat(req.body.price),
			shipping_price: parseFloat(req.body.shipping_price), buybutton: req.body.buybutton,
			images: image_array, shipping: req.body.shipping, identifier: req.body.identifier,
			createdAt: new Date()};


		var collection = db.collection('items');

		collection.insert(jsonObject, function(err, records) {
			console.log("Record inserted");

			//mail on new item creation
			mail.newItem();
		
			var html = "You are trying to sell " + req.body.title + "<br />"
				+	"Using the following images: <br />";

			//wrap through images
			for (i = 0; i < image_array.length; i++) {
				html = html + '<img src="/uploads/' +  image_array[i].filename + '" width="400">'
			}

			html = html + "<br />You would like it in the category " + req.body.category + "<br />"
				+	"The description you have given is " + req.body.description + "<br />"
				+	"Your seller id is " + req.body.seller_id + "<br />"
				+	"You would like the following for your payment methods: " + req.body.payment + "<br />"
				+	"You would like to charge $" + req.body.price + "<br />"
				+	"Shipping will cost $" + req.body.shipping_price + "<br />"
				+	"Shipping info given " + req.body.shipping + "<br />"
				+	'<p /> Have something else to sell? <a href="/sell">Click here.</a>';

				var page = generateHead(req) + html + htmlFoot;
			res.send(page);
		});
	});
});


//multer
var mwMulter = multer({ dest: './uploads/',
					rename: function(fieldname, filename) {
						return sha1(filename + Date.now() + Math.random());
					},
					limits: {
						fileSize: 1000000
					},
					onFileUploadStart: function(file) {
						console.log(file.originalname + ' is starting...')
					},
					onFileUploadComplete: function(file) {
						gm(file.path).options({imageMagick: true}).resize(400,266).write('uploads/thumb' + file.name, function (err) {
							if (err) console.log(err)});
						console.log(file.fieldname + ' uploaded to ' + file.path)
						done = true;
					}
				});

//image upload
app.post('/uploadimage', ensureAuthenticated, mwMulter, function(req, res) {
	console.log('printing out req.files');
	console.log(req.files);
	console.log(req.files.file);
	console.log(req.files.file.name);
	console.log(req.user.tofuMarket_id);
	console.log('req.body.identifier is ' + req.body.identifier);
	if(done==true) {
		console.log(req.files);

		//now pair new image name with identifier
		//this is how we figure out which images go with which items
		var db = mongojs(config.mongodb.db);

		var collection = db.collection('images');
		collection.insert( { filename: req.files.file.name, identifier: req.body.identifier, tofuMarket_id: req.user.tofuMarket_id, timestamp: new Date()},
			function () {
				//mail image upload
				mail.newImage();
				res.end("File uploaded.");
			});
	}
});


/*
	EDIT ITEM
*/

//edit sell/item post form
app.get('/edit', ensureAuthenticated, function(req, res) {
	var html = "<h1>Edit Item " + req.query.id + "</h1>";

	var db = mongojs(config.mongodb.db);
	console.log("Connected through mongojs");

	var items = db.collection('items');
	console.log("Items collection selected");

	items.find({_id: createObjectId(req.query.id)}, function (err, docs) {
		if (err) console.log("Err: " + err);
		console.log("Docs[0]: " + docs[0]);

		html = html + '<form action="/edit" method="post">'
		+	'<table><tr><td>'
	  	+	'Title:</td><td>'
	  	+	'<input type="text" name="title" value="' + (docs[0].title ? docs[0].title : ' ').toString() + '"/></td></tr><tr><td>'
	  	+	'Category:</td><td>'
	  	+	'<input type="text" name="category" value="' + (docs[0].category ? docs[0].category : ' ').toString() + '"/></td></tr><tr><td>'
	  	+	'Description:</td><td>'
	  	+	'<input type="text" name="description" value="' + (docs[0].description ? docs[0].description : ' ').toString() + '" /></td></tr><tr><td>'
	  	+	'<input type="hidden" name="seller_id" value="' + req.user.tofuMarket_id + '"/></td></tr><tr><td>'
	  	+	'Payment:</td><td>'
	  	+	'<input type="text" name="payment" value="' + (docs[0].payment ? docs[0].payment : ' ').toString() + '" /></td></tr><tr><td>'
	  	+	'Price:</td><td> '
	  	+	'<input type="text" name="price" value="' + (docs[0].price ? docs[0].price : ' ').toString() + '" /></td></tr><tr><td>'
	  	+	'Shipping Cost:</td><td>'
	  	+	'<input type="text" name="shipping_price" value="' + (docs[0].shipping_price ? docs[0].shipping_price : ' ').toString() + '" /></td></tr><tr><td>'
	  	+	'Shipping Info:</td><td>'
	  	+	'<input type="text" name="shipping" value="' + (docs[0].shipping ? docs[0].shipping : ' ').toString() + '" /></td></tr><tr><td>'
	  	+	'<input type="hidden" name="item_id" value="' + (docs[0]._id).toString() + '" />'
	  	+	'<p /><input type="submit" value="Update Item" /></td></tr></table>'
		+	'</form>';

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);

	});

});

//accept form info from edit; saves old info to a separate collection
app.post('/edit', ensureAuthenticated, function(req, res) {
	var html = "<h1>Item " + req.body.item_id + " Edited</h1>"

	var db = mongojs(config.mongodb.db);

	var items = db.collection('items');

	//check if user can delete item...
	items.find({_id: createObjectId(req.body.item_id), seller_id: req.user.tofuMarket_id}, function (err, docs) {

		console.log("docs: " + docs[0]);
		//if docs isn't empty, user is creator and has permission
		if (docs[0]) {
			console.log("User has access");

			docs[0].editedTime = new Date();
			//storing _id in itemId for matching up with other edits
			docs[0].itemId = docs[0]._id;
			//deleting so that editedItems can create own _id; also, there might be multiple edits.
			delete docs[0]._id;

			//move to "editedItems" collection
			var editedItems = db.collection('editedItems');
			editedItems.insert(docs, function () {
				console.log("Item moved to editedItems. docs[0]: " + docs[0]);

				//update item in "items" collection
				items.update({_id: createObjectId(req.body.item_id)}, {$set: {
					title: req.body.title, category: req.body.category, description: req.body.description,
					payment: req.body.payment, price: parseFloat(req.body.price), shipping_price: parseFloat(req.body.shipping_price),
					shipping: req.body.shipping}}, function () {
					console.log("Item edited");

					var page = generateHead(req) + html + htmlFoot;
					res.send(page);
				});
			});
		} else {
			//user did not create this item
			html = html + "User doesn't have access to this item.";
			console.log("User doesn't have access");

			var page = generateHead(req) + html + htmlFoot; 
			res.send(page);
		}
	});
});


/*
	REMOVE ITEM
*/

//delete sell/item post; saves to a separate collection
app.get('/remove', ensureAuthenticated, function(req, res) {
	var html = "<h1>Delete Item " + req.query.id + "</h1>";

	html = html + "Are you sure you want to delete this listing?<p />"
		+	'<form action="/remove?id=' + req.query.id + '" method="post">'
		+	'<input type="hidden" name="item" value="' + req.query.id + '" />'
		+	'<input type="Submit" value="Confirm Delete">'

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

//after delete confirmed send info here
app.post('/remove', ensureAuthenticated, function(req, res) {

	var db = mongojs(config.mongodb.db);

	var items = db.collection('items');

	//check if user can delete item...
	items.find({_id: createObjectId(req.query.id), seller_id: req.user.tofuMarket_id}, function (err, docs) {

		console.log("docs: " + docs[0]);
		//if docs isn't empty, user is creator and has permission
		if (docs[0]) {
			console.log("User has access");

			docs[0].removedTime = new Date();

			//move to "removed" collection
			var removed = db.collection('removed');
			removed.insert(docs, function () {
				console.log("Item moved to removed. docs[0]: " + docs[0]);

				//remove item from "items" collection
				items.remove({_id: createObjectId(req.query.id)}, function () {
					console.log("Item removed from items");

					var html = "<h1>Item Deleted</h1>";

					var page = generateHead(req) + html + htmlFoot;
					res.send(page);
				});
			});
		} else {
			//user did not create this item
			html = html + "User doesn't have access to this item.";
			console.log("User doesn't have access");

			var page = generateHead(req) + html + htmlFoot; 
			res.send(page);
		}
	});
	
});


/*

	DASHBOARD
	user dashboard

*/

var userDashboardHtml = "<h1>User Dashboard</h1>"
		+ '<a href="/dashboard/notifications">Notifications</a> | '
		+	'<a href="/dashboard/questions">Questions</a> | '
		+	'<a href="/dashboard/messages">Messages</a> | '
		+	'<a href="/dashboard/buying">Buying</a> | '
		+	'<a href="/dashboard/selling">Selling</a> | '
		+	'<a href="/dashboard/settings">Settings</a><p />';


app.get('/dashboard', ensureAuthenticated, function(req, res) {
	
	var html = userDashboardHtml;

	html = html + 'Connect another outside account with this one.';

	//check for null twitter_userid, google_userid, fbuserid. allow multiple twitter/google but not fb (?)
	//present accounts that are currently connected
	//You currently have the following accounts connected:
	//userid...userid...etc
	//Would you like to connect one of the following?
	//Google
	//Twitter
	//You already have a facebook account connected....

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);

});

//checks if the user has permission, then, if so, marks an item as sold
app.get('/sold', ensureAuthenticated, function(req, res) {
	var db = mongojs(config.mongodb.db);
	var items = db.collection('items');
	var html = "";

	//check for that user is creator of item
	items.find({_id: createObjectId(req.query.id), seller_id: req.user.tofuMarket_id}, function (err, docs) {

		console.log("docs: " + docs[0]);
		if (docs[0]) {
			html = html + "Item marked as sold.";
			console.log("User has access");

			//mark item status as sold in collection
			items.update({_id: createObjectId(req.query.id)},{$set:{status:"sold"}},{multi: true}, function () {
				var page = html;
				res.send(page);
			});
		} else {
			//user did not create this item
			html = html + "User doesn't have access to this item.";
			console.log("User doesn't have access");

			var page = html;
			res.send(page);
		}
	});
});

//need to separate out the dashboard into functions
//notifications
app.get('/dashboard/notifications', ensureAuthenticated, function(req, res) {
	var html = userDashboardHtml;
	html = html + "<h2>Notifications</h2>";

	var db = mongojs(config.mongodb.db);
	//notifications
	var collection = db.collection('notifications');
	collection.find( { owner: req.user.tofuMarket_id }, function (err, docs) {
		//console.log(docs);
		for (var i = 0; i < docs.length; i++) {
			html = html + 'Type: ' + (docs[i].type ? docs[i].type : 'empty').toString() + '<br />';
			html = html + 'From: ' + (docs[i].from ? docs[i].from : 'empty').toString() + '<br />';
			html = html + 'Notes: ' + (docs[i].notes ? docs[i].notes : 'empty').toString() + '<br />';
			html = html + '<a href="/dashboard/notificationreply?id=' + docs[i]._id + '">Reply</a> | '
				+	'Archive | Delete<p />';
		}
		if (docs.length == 0) {
			html = html + 'No notifications <p />';
		}

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});

//notification reply
app.get('/dashboard/notificationreply', ensureAuthenticated, function(req, res) {
	var html = "";
	//make sure user has authority to reply
	var db = mongojs(config.mongodb.db);
	var notifications = db.collection("notifications");

	//if owner, then good
	notifications.find({ _id : createObjectId(req.query.id) }, function (err, docs) {
		console.log(req.query.id);
		console.log(docs);

		//check if notification even exists...
		if (docs.length == 0) {
			html = html + '<p />User does not have rights to this message.';
			var page = generateHead(req) + html + htmlFoot;
			res.send(page);
		} else {
			//check owner
			if (req.user.tofuMarket_id === (docs[0].owner ? docs[0].owner : 'empty').toString()) {
				/*
				 *	user is owner and can reply to notification
				 */
				html = html + '<p />'
					+	'Reply to notification:<br />'
					+	'<form action="/dashboard/notificationreply" method="post">'
					+	'<textarea cols="50" rows="10" name="notes"></textarea>'
					+	'<input type="hidden" name="to"	value="' + docs[0].from + '" />'
					+	'<input type="hidden" name="itemId" value="' + docs[0].itemId + '" />'
					+	'<input type="hidden" name="prev_note_id" value="' + docs[0]._id + '" /><p />'
					+	'<input type="submit" value="Send Reply" />';
				var page = generateHead(req) + html + htmlFoot;
				res.send(page);
			} else {
				html = html + '<p />User does not have rights to this message.';
				var page = generateHead(req) + html + htmlFoot;
				res.send(page);
		}
		}
	});
});

//post page for notification reply
app.post('/dashboard/notificationreply', ensureAuthenticated, function(req, res) {
	var html = '';
	var db = mongojs(config.mongodb.db);
	var notifications = db.collection("notifications");

	//if owner, then good
	notifications.find({ _id : createObjectId(req.body.prev_note_id) }, function (err, docs) {
		console.log(req.body.prev_note_id);
		console.log(docs);

		//check if notification even exists...
		if (docs.length == 0) {
			html = html + '<p />User does not have rights to this message.';
			var page = generateHead(req) + html + htmlFoot;
			res.send(page);
		} else {
			//check owner
			if (req.user.tofuMarket_id === (docs[0].owner ? docs[0].owner : 'empty').toString()) {
				/*
				 *	user is owner; do inserts (i.e. reply)
				 */
				//need one object for owner: seller, one object for owner: buyer
				var notificationObject = { type: "Reply", to: req.body.to, from: req.user.tofuMarket_id, itemId: req.body.id, notes: req.body.notes, timeSent: new Date(), owner: req.user.tofuMarket_id };
				var notificationObject2 = { type: "Reply", to: req.body.to, from: req.user.tofuMarket_id, itemId: req.body.id, notes: req.body.notes, timeSent: new Date(), owner: req.body.to };
				console.log(notificationObject);
				console.log(notificationObject2);
				notifications.insert([notificationObject, notificationObject2], function (err, details) {
					console.log('details: ' + details);
					html = html + '<p />You have replied to notification id: ' + req.body.prev_note_id;
					var page = generateHead(req) + html + htmlFoot;
					res.send(page);
				});
			} else {
				html = html + '<p />User does not have rights to this message.';
				var page = generateHead(req) + html + htmlFoot;
				res.send(page);
		}
		}
	});
});

//questions
app.get('/dashboard/questions', ensureAuthenticated, function(req, res) {
	var html = userDashboardHtml;
	html = html + "<h2>Questions</h2>";

	var db = mongojs(config.mongodb.db);
	//questions
	var questions = db.collection('questions');
	questions.find( { to: req.user.tofuMarket_id } , function (err, docs) {
		//console.log(docs);
		for (var i = 0; i < docs.length; i ++) {
			html = html + 'From: ' + (docs[i].from ? docs[i].from : 'empty').toString() + '<br />';
			html = html + 'Question: ' + (docs[i].question ? docs[i].question : 'empty').toString() + '<p />';
		}
		if (docs.length == 0) {
			html = html + 'No questions <p />';
		}

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});

//messages
app.get('/dashboard/messages', ensureAuthenticated, function(req, res) {
	var html = userDashboardHtml;
	html = html + "<h2>Messages</h2>";

	var db = mongojs(config.mongodb.db);
	//next find messages
	var messages = db.collection('messages');
	messages.find( { to: req.user.tofuMarket_id }, function (err, docs) {
		for (var i = 0; i < docs.length; i++) {
			html = html + 'From: ' + (docs[i].from ? docs[i].from : 'empty').toString() + '<br />';
			html = html + 'Message: ' + (docs[i].message ? docs[i].message : 'empty').toString() + '<p />';
		}
		if (docs.length == 0) {
			html = html + 'No messages <p />';
		}

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});

//buying
app.get('/dashboard/buying', ensureAuthenticated, function(req, res) {
	var html = userDashboardHtml;
	html = html + "<h2>Buying</h2>";

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
})

//selling
app.get('/dashboard/selling', ensureAuthenticated, function(req, res) {
	var html = userDashboardHtml;
	html = html + "<h2>Selling</h2>";

	var db = mongojs(config.mongodb.db);

	var items = db.collection('items');
	items.find( { seller_id: req.user.tofuMarket_id } ).sort({_id: -1}, function (err, docs) {
		for (var i = 0; i < docs.length; i++) {
			html = html + 'Item ID: ' + (docs[i]._id ? docs[i]._id : 'empty').toString() + '<br />';
			html = html + 'Title: <a href="/item?id=' + (docs[i]._id ? docs[i]._id : 'empty') + '">' + (docs[i].title ? docs[i].title : 'empty').toString() + '</a><br />'
			html = html + '<a href="/edit?id=' + (docs[i]._id ? docs[i]._id : 'empty').toString() + '">Edit</a> | '
				+	'<a href="/remove?id=' + (docs[i]._id ? docs[i]._id : 'empty').toString() + '">Remove</a> | '
				+	'<a href="/sold?id=' + (docs[i]._id ? docs[i]._id : 'empty').toString() + '">Mark as Sold</a><p />'
		}
		if (docs.length == 0) {
			html = html + 'No items selling <p />';
		}

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});

/*

	USER
	display information about a user publicly

*/
app.get('/user', function(req, res) {
	var db = mongojs(config.mongodb.db);

	var users = db.collection('users');

	var html = '<h1>User ' + req.query.id + '</h1>';

	users.find({_id: createObjectId(req.query.id) }, function(err, docs) {

		console.log(docs);

		if (docs == null || docs.length == 0) {

		html = html + "User does not exist.";

		} else {

			html = html + '<h2>Info</h2>'
		+	'Name: ' + (docs[0].name ? docs[0].name : 'empty') + '<p />';
		try {
			html = html +	'Facebook profile: ' + (docs[0].other.profileUrl ? docs[0].other.profileUrl : 'empty') + '<p />';
		} catch(err) {
			console.log("No user profile for this user...");
		}
		html = html +	'Other site usernames: <p />'
		+	'Personal Note: <p />'
		+	'<h2>Karma</h2>';

		}

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);

	});
	
});


/*

	SETTINGS
	place where user can update settings and personal information

*/

app.get('/dashboard/settings', ensureAuthenticated, function (req, res) {
	var html = userDashboardHtml;
	html = html + "<h1>Settings</h1>";

	var db = mongojs(config.mongodb.db);
	var users = db.collection("users");

	users.find({_id : createObjectId(req.user.tofuMarket_id)}, function (err, docs) {

		//need to display main email
		html = html + 'The following email address is used for buying, selling and other communication on the site.<p />'
			+	'Main email: <form action="/dashboard/settings" method="post"><input type="text" value="' + docs[0].main_email + '" name="main_email" /><p />'
			+	'<input type="submit" value="Update Settings" />'
			+	'</form><p />'; 
		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});

//get updated settings info
app.post('/dashboard/settings', ensureAuthenticated, function (req, res) {
	var html = userDashboardHtml;
	html = html + "<h1>Settings Updated</h1>";

	var db = mongojs(config.mongodb.db);
	var users = db.collection("users");

	users.update({_id : createObjectId(req.user.tofuMarket_id)}, { $set: { main_email: req.body.main_email } }, function() {
		html = html + "Main email now " + req.body.main_email + "<p />";
		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});


/*

	KARMA
	user feedback for buying or selling (or failing to...)

*/

app.get('/karma', ensureAuthenticated, function (req, res) {
	var html = "<h1>Karma</h1>";

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
})


/*

	BUY
	buy item

*/
app.get('/buy', ensureAuthenticated, function(req, res) {
	var html = "<h1>Buy Item</h1>";
	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

app.post('/buy', ensureAuthenticated, function(req, res) {
	var html = "<h1>Buying Item</h1>";
	html = html + '<b>Item id:</b> <a href="/item?id=' + req.query.id + '">' + req.query.id + '</a><p />';
	html = html + ""
	html = html + "This does not guarantee purchase. The seller will review your profile and shipping information to determine risk. Please include any information the seller has requested or any other useful information in the 'notes' message below. After the seller reviews, you will either receive an invoice (e.g. through paypal) or a message declining the sale. If you have any problems please <a href='/contact'>contact us</a>.<p />";
	html = html + '<form action="/buyconfirmed?id=' + req.query.id + '" method="post">Notes to seller:<br />'
		+	'<textarea name="notes" cols="50" rows="5">Enter additional information for seller here... This might be paypal email address, shipping address, or other information they may not know.</textarea><br /><input type="submit" value="Confirm Purchase"></form>'
	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

app.post('/buyconfirmed', ensureAuthenticated, function(req, res) {

	var db = mongojs(config.mongodb.db);

	console.log('mongojs');

	//get seller id
	var items = db.collection("items");
	items.find({_id: createObjectId(req.query.id) }, {_id: 0, seller_id: 1 }, function (err, docs) {
		//returned seller id
		console.log(docs[0].seller_id);

		//now insert into notifications
		var collection = db.collection("notifications");

		console.log(req.user.tofuMarket_id);

		var notificationObject = { type: "Buy", to: docs[0].seller_id, from: req.user.tofuMarket_id, itemId: req.query.id, notes: req.body.notes, timeSent: new Date() };
		//assign ownership to seller
		notificationObject.owner = docs[0].seller_id;
		collection.insert( notificationObject,
			function (err, details) {});

		var html = "<h1>You have purchased item id " + req.query.id + '</h1>';

		html = html + "You will receive more information from the seller shortly.";

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);
	});
});


/*
	ASK QUESTION
	let's users ask seller a question.
	also gives sellers ability to respond
*/

app.post('/askquestion', ensureAuthenticated, function(req, res) {
	var html = "<h1>Ask Question</h1>"
	+	'<form action="/submitquestion?id='+ req.query.id + '" method="post">'
	+	'Message: <br /><textarea name="question" cols="50" rows="5">Enter question here...</textarea><br />'
	+	'<input type="submit">'
	+	'</form>';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

app.post('/submitquestion', ensureAuthenticated, function(req, res) {
	var db = mongojs(config.mongodb.db);

	//get id of user to send question to
	var items = db.collection('items');
	items.find({_id: createObjectId(req.query.id)}, {seller_id: 1, _id: 0}, function (err, docs) {
		var recipient = docs[0].seller_id;

		var jsonObject = {itemid: req.query.id, from: req.user.tofuMarket_id, to: recipient, question: req.body.question,
		 	timestamp: new Date()};

		var questions = db.collection('questions');
		questions.insert(jsonObject, function (err, records) {
			console.log("Message inserted");

			var html = "<h1>Question Sent</h1>"
				+	'You asked: <p/>'
				+	req.body.question + '<p />'
				+	'<a href="/item?id=' + req.query.id + '">Return to item.</a>';

			var page = generateHead(req) + html + htmlFoot;
			res.send(page);
		});

	});

});


/*

	CONTACT
	Form for contacting site admin.

*/
//get info
app.get('/contact', function (req, res) {

		var html = "<h1>Contact us</h1>";
		html = html + '<form action="/contact" method="post">'
		+	'Email address (so we can reply): <br /><input type="text" size="40" name="email"><p />'
		+	'Message: <br /><textarea name="message" cols="50" rows="5">Enter message here...</textarea><br />'
		+	'<input type="submit">'
		+	'</form>'

		var page = generateHead(req) + html + htmlFoot;
		res.send(page);

});

//post info
app.post('/contact', function (req, res) {
	var db = mongojs(config.mongodb.db);

	var collection = db.collection('contact');

	var jsonObject = {email: req.body.email, message: req.body.message,
	 	timestamp: new Date()};

	collection.insert(jsonObject, function (err, records) {
		console.log("Message inserted");
		var html = "<h1>Thank you for your comments.</h1> <p />"
			+	"You sent the following with email address " + req.body.email + ":<p />"
			+ req.body.message;

		var page = generateHead(req) + html + htmlFoot;

		res.send(page);
	});
});


/*

	ADMINISTRATION PAGES
	see new users, verify users, delete items, issue warnings, block users

*/
app.get('/admin', ensureAuthenticated, function (req, res) {
	
	var html = "";
	html = html + "<h1>Admin</h1>";
	html = html + "<h2>Contact Messages</h2>";

	var db = mongojs(config.mongodb.db);
	
	//find contact messages
	var collection = db.collection('contact');
	collection.find( function (err, docs) {
		if (err) console.log('error...');
		console.log(docs.length);
		console.log(docs);
		for (var i = 0; i < docs.length; i ++){
			html = html + docs[i]["timestamp"]  + '<br />' + docs[i]["email"] + '<br />' + docs[i]["message"] + '<p />';
		}

		html = html + "<h2>New Users</h2>"
		//get latest users
		var users = db.collection('users');
		users.find().limit(10).sort({_id: -1}, function (err, docs) {
			if (err) console.log('error getting users /admin');
			console.log(docs)
			for (var i = 0; i < docs.length; i++) {
				html = html + 'name: ' + docs[i]["name"] 
					+ '<br />id: ' + docs[i]["_id"] 
					+ '<br/> fbuserid: ' + docs[i]["fbuserid"] 
					+ '<br/> google_userid: ' + docs[i]["google_userid"] 
					+ '<br/> twitter_userid: ' + docs[i]["twitter_userid"] 
					+ '<br/>Created: ' + docs[i]["created"] + '<p/>';
			}
		
			var page = generateHead(req) + html + htmlFoot;
			res.send(page);
		})
		
	});
});


/*

	INFO PAGES...
	fairly static

*/
/*
	FAQ
*/
app.get('/faq', function (req, res) {
	var html = "<h1>FAQ</h1>"
	+	"<ol>"
	+	'<li>How can Tofu Market run without fees?'
	+	'<blockquote>We will always allow at minimum 10 free, non-fee postings per member per month. Currently we allow as many as an individual would like to post. We do our best to keep costs low and we love what we do. We may charge fees for services in the future, but they will be directed at larger businesses, not small sellers, and the services will be largely auxillary and not central to selling.</blockquote></li>'
	+	'<li>How are buyers protected?'
	+	'<blockquote>Buyers are able to judge a seller not only on past performance, but also based on the seller\'s social connections (Facebook, Twitter, Google Plus). It is also recommended to use a service like Paypal for transactions. Paypal protects buyers if a seller does not follow through. Requiring mail tracking services is also recommended. All of these protections together create a secure and safe experience for buyers.</blockquote></li>'
	+	'<li>How are sellers protected?'
	+	'<blockquote>Sellers can also judge buyers based not only on past performance, but also on social connections (Facebook, Twitter, Google Plus). It is also recommended that sellers use well-known services for executing online transactions (e.g. Paypal) and sending items only to certified addresses. Requiring mail tracking and adding insurance on larger more expensive items is also recommended. All of these protections create a secure and safe experience for sellers.</blockquote></li>'
	+	'<li>How much can I save?'
	+	'<blockquote>Without final value fees, fees charged on shipping costs, insertion fees, or other fees, your savings could be astronomical, all depending on how much business you do. If you sell 10 items a month at an average price of $10, with $3 of shipping, in a category that typically requires $0.20 insertion fees, you\'ll save $180 a year compared to a service with 10% final value fees. If you sell one item for $500, with $25 shipping you\'ll save at least $57.50 on the transaction. Overall savings depend on the specific transactions and which service you were previously using. But, we do not put a limit on how much you can save. Savings with us are unlimited.</blockquote></li>'
	+	'</ol>';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
})

/*
	ABOUT
*/
app.get('/about', function (req, res) {
	var html = "<h1>About</h1>"
	+	"Tofu Market is a relatively small company started in early 2015. Tofu Market's mission is to provide an open, free, and safe marketplace to individuals and communities. <p />"
	+	'Please <a href="/contact">contact us</a> if you have any questions or concerns.';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
})

/*
	HOW TO
*/
app.get('/howto', function (req, res) {
	var html = "<h1>How To</h1>"
	+	"<h2>How to Buy:</h2> <p />"
	+	"<ol>"
	+	'<li>Sign up for an account. <a href="/signup_info">Sign up here</a>.</li>'
	+	'<li>Search for the item you\'re interested in. <a href="/search">You can search here</a> or at the top of most pages.</li>'
	+	'<li>Click on the "Purchase" button. This will be below the image(s) of the item you\'re interested in.</li>'
	+	'<li>Give the buyer any additional information (Paypal account email address, for instance).</li>'
	+	'<li>Click "Confirm Purchase".</li>'
	+	'<li>The seller will send you an invoice either via email or another service like Paypal.</li>'
	+	'<li>Pay and your item will arrive soon!</li>'
	+	'</ol>'
	+	''
	+	'<h2>How to Sell:</h2> <p />'
	+	'<ol>'
	+	'<li>Sign up for an account. <a href="/signup_info">Sign up here</a>.</li>'
	+	'<li>Click "Sell" at the top of any page. <a href="/sell">You can also click here</a>.</li>'
	+	'<li>Click or drop image files on specified area. This will upload images to the website.</li>'
	+	'<li>Fill out other information.</li>'
	+	'<li>Click "Sell Item"</li>'
	+	'<li>Respond to buyers.</li>'
	+	'<li>Complete the transaction through chosen service (e.g. Paypal).</li>'
	+	'<li>Ship item to buyer.</li>'
	+	'</ol>';

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
})


/*

	SEARCH
	because on-site search is important

*/

app.get('/search', function(req, res) {
	var html = "";
	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
});

app.post('/search', function(req, res) {
	var html = '<h2>"' + req.body.search_entry + '"</h2><p />';

	var db = mongojs(config.mongodb.db);
	var items = db.collection('items');

	items.find({ "$text": { "$search": req.body.search_entry } }, function(err, docs) {
	
	for (var i = 0; i < docs.length; i++) {
		html = html + '<a href="/item?id=' + docs[i]._id + '">' + docs[i].title + '</a> - $' + docs[i].price  
			+	'<p />';
	}

	var page = generateHead(req) + html + htmlFoot;
	res.send(page);
	});
});

/*

	REFERRALS
	encourage people to refer others

*/

app.get('/referrals', referrals.main);


/*

	SUGGESTIONS
	point people towards things they may like

*/

/*
	404
	If nothing above applies to the request...
*/
app.use(function(req, res, next) {
	res.status(404).send('404: page not found.<p /> <a href="/contact">Contact us</a> if you think there\'s a problem.');
})

//run app
app.listen(config.web.port);
console.log('Server running at http://127.0.0.1:' + config.web.port + '/');
