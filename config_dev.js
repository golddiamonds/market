var config = {}

config.mongodb = {};
config.web = {};
config.fb = {};
config.twitter = {};
config.google = {};

config.mongodb.port = 27071;
config.mongodb.db = 'sitedev'; //name of dev db
config.mongodb.uri = 'mongodb://127.0.0.1:27017/sitedev'; //point to dev db

config.web.port = 5838;

//messed up on this fb config...should be config.fb.appId = ...will fix soon
config.appId = "";
config.appSecret = "";
config.callbackURL = "http://devsiteurl/auth/facebook/callback"; //place your dev url in for devsiteurl

config.twitter.consumerKey = "";
config.twitter.consumerSecret = "";
config.twitter.callbackURL = "http://devsiteurl/auth/twitter/callback"; //place your dev url in for devsiteurl

config.google.returnURL = "http://devsiteurl/auth/google/callback"; //place your dev url in for devsiteurl
config.google.realm = "http://devsiteurl"; //place your dev url in for devsiteurl
config.google.clientID = "";
config.google.clientSecret = "";
config.google.callbackURL = "http://devsiteurl/auth/google/callback"; //place your dev url in for devsiteurl


module.exports = config;
