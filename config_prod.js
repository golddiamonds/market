var config = {}

config.mongodb = {};
config.web = {};
config.fb = {};
config.twitter = {};
config.google = {};

config.mongodb.port = 27071;
config.mongodb.db = 'proddb'; //production db name
config.mongodb.uri = 'mongodb://127.0.0.1:27017/proddb'; //point to production db

config.web.port = 3000;

config.appId = "";
config.appSecret = "";
config.callbackURL = "https://siteurl/auth/facebook/callback"; //change siteurl

config.twitter.consumerKey = "";
config.twitter.consumerSecret = "";
config.twitter.callbackURL = "https://siteurl/auth/twitter/callback"; //change siteurl

config.google.returnURL = "https://siteurl/auth/google/callback"; //change siteurl
config.google.realm = "https://siteurl"; //change siteurl
config.google.clientID = "";
config.google.clientSecret = "";
config.google.callbackURL = "https://siteurl/auth/google/callback"; //change siteurl

module.exports = config;
