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
  mongoose.connect('mongodb://nodeUser:JgKwWLVBYUy2RA8pKRYTg9rN7idRcbYnaGph2Ur@localhost:27314/rsvp')
}else{
  mongoose.connect('mongodb://localhost/bryllup');
}


var config = {};

config.cookieSecret = "6L2pmgZ4QiRTVyhTVaerWT7Z9qUN";
config.authKey = "r4Ket-s4kzR";
config.mg_api_key = "key-609fe452374be0986a6acec3d32cccc2";
config.mg_domain = "mail.martineognikolai.dk";

var mailgun = require('mailgun-js')({
  apiKey: config.mg_api_key,
  domain: config.mg_domain
});


var data = {
  from: 'Snart Gift <martine.nikolai@gmail.com>',
  to: 'rikardeide@gmail.com',
  subject: 'Skal vi se',
  text: 'Jeg prøver å sende meg selv mail!'
};

var list = mailgun.lists('guest@mail.martineognikolai.dk');

list.info(function (err, data) {
  // `data` is mailing list info
  console.log(data);
});


var getMailListMembers = function () {
  list.members().list(function (err, members) {

  });
};

var addToMailingList = function (email) {
  var member = [{
    address: email
  }];
  list.members().add({members: member, subscribed: true}, function (err, body) {
    console.log(body);
    if(err) {
      // Log error
    } else{
      console.log("Email added to list");
    }
  });
};

var sendConfirmationMail = function (email) {

};

// Route to verift email
app.get('/validate/:mail', function (req, res) {
  console.log("validating email:");
  console.log(req.params.mail);

  //TODO: Verify email address.

  res.send("heisann prøvder du å validere?");
});

// Sending email example
if(false) {
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      console.log("ERROR: couln't send mail! ");
    }
    console.log(body);
  });
}

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

  Reply.find(function (err, doc) {
    console.log(doc);
  });
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
  if(inn.form) {
    if (inn.token && verifyToken(token)) { // User "authenticated"

      console.log("form received");

      // TODO: Sanitize/validate


      var clean = {}; // Sanitized fields

      /*---------Database calls -------*/

      var gunnar = new Reply({
        name: clean.name,
        email: clean.email
      });

      gunnar.save(function (err, gunnar) {
        if (err) return console.error(err);
        console.log("Saved: " + gunnar);
      });


      /*--------- Everything ok? Send confirmation email -------*/

      addToMailingList(clean.email);
      sendConfirmationMail(clean.email);

    }
  }
});