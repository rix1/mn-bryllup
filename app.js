var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var csrf = require('csurf');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var debug = true;
//var config = require('./lib/config'); //config.js file with hard-coded options.

// In production
if(!debug){
  //mongoose.connect('mongodb://nodeUser:JgKwWLVBYUy2RA8pKRYTg9rN7idRcbYnaGph2Ur@localhost:27314/rsvp')
}else{
  //mongoose.connect('mongodb://localhost/bryllup');
}


var config = {};

config.cookieSecret = "6L2pmgZ4QiRTVyhTVaerWT7Z9qUN";
config.authKey = "r4Ket-s4kzR";

app.use(cookieParser(config.cookieSecret, { httpOnly: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({
  name: 'sessionID',
  secret: config.sessionSecret,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    maxAge: 3600000
  },
  rolling: true,
  resave: false,
  saveUninitialized: true
}));

app.use(csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});


var replySchema = new Schema({
  name       : { type: String, required: true, lowercase: true, trim: true }, //index: { unique: true } might be smurt for avoiding duplicates
  email        : { type: String, required: true },
  date_created    : { type: Date, required: true, default: Date.now }
});

var Reply = mongoose.model('Reply', replySchema, 'rsvp');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log("Database connection established");
});

app.set('port', 3000);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');

  //Reply.find(function (err, doc) {
  //  console.log(doc);
  //});
});

var verifyToken = function (token) {
  if(token == config.authKey){
    return true;
  }else return false;
};

app.post('/', function (req, res) {
  console.log("Someone tries to RSVP");
  var inn = req.body;

  console.log(inn);

  if(inn.token){
    console.log("Token Received: " + inn.token);
    if(verifyToken(inn.token)){
      console.log("everything ok");
      res.status(200);
      res.send("Okai");
    }else{
      console.log("NOT K, OKAI?");
      res.status(403);
      res.send("Nope!");
    }
  }
  if(inn.form){
    console.log("form received");

    // TODO: Sanitize/validate

    var gunnar = new Reply({
      name: inn.name,
      email: inn.email
    });
    //
    //gunnar.save(function (err, gunnar) {
    //  if(err) return console.error(err);
    //  console.log("Saved: " + gunnar);
    //});
  }
});
