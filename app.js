var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var csrf = require('csurf');
var expressValidator = require('express-validator');
var helmet = require('helmet');
var _ = require('underscore');
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

app.use(helmet());
app.use(cookieParser(config.cookieSecret, { httpOnly: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator([]));



// ================ MAIL ===========


var mailgun = require('mailgun-js')({
  apiKey: config.mg_api_key,
  domain: config.mg_domain
});

var list = mailgun.lists('guest@mail.martineognikolai.dk');

var getMailListMembers = function () {

  /* List emails in guest list
   list.info(function (err, data) {
   // `data` is mailing list info
   console.log(data);
   });
   */

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

var createPeopleList = function (people) {
  var list = '';

  // Det vi må gjrøe: For hvert element i listen skriv ut navnet
  // ettefulgt av paranteer men dagene personen kommer.
  // Rikard Eide (Lørdag, Søndag) etterfulgt av linjeskift

  return '';
};


var getAcceptMail = function (data) {

  //var deltagere = createPeopleList(data.people);

  var body = 'Hei!\nSå hyggelig at du har anledning til å komme!\n' +
      'Vi har foreløpig registrert følgende informasjon: ' + '\n\n' +
      "Epost:\t" + data.email + "\nMelding: " + data.msg +
      "\n\nVennligst bekreft at denne informasjonen stemmer ved å klikke på følgende link:\n" +
      "http://martineognikolai.dk/confirm/" + data._id;

  var acceptEmail = {
    from: 'Martine og Nikolai <martine.nikolai@gmail.com>',
    to: data.email,
    subject: 'Martine og Nikolai: Vennligst bekreft eposten din',
    text: body
  };

  return acceptEmail;

};

var getDeclineMail = function (data) {
  var body = 'Det var leit at du ikke har anledning til å komme. Vennligst bekreft at dette stemmer ved å besøke følgende link:\n' +
      "http://martineognikolai.dk/confirm/" + data._id;

  var declineEmail = {
    from: 'Martine og Nikolai <martine.nikolai@gmail.com>',
    to: data.email,
    subject: 'Martine og Nikolai: Vennligst bekreft eposten din',
    text: body
  };

  return declineEmail;
};


var sendConfirmationMail = function (data, value) {
  var mail = '';

  if(value){
    mail = getAcceptMail(data);
  }else{
    mail = getDeclineMail(data);
  }

  mailgun.messages().send(mail, function (err, body) {
    if (err) {
      console.log("ERROR: couln't send mail! ");
      console.log(err);
    }else{
      console.log("Mail sent:");
      console.log(body);
    }
  });
};

var sendLogMail = function (data) {
  var body = Date.now + "RSVP registrert:\n" + data;

  var logMail = {
    from: 'Snart Gift <martineognikolai@mail.martineognikolai.dk>',
    to: 'rikardeide@gmai.com',
    subject: 'mnBryllup: RSVP registrert',
    text: body
  };


  mailgun.messages().send(logMail, function (err, body) {
    if (err) {
      console.log("ERROR: couln't send mail! ");
      console.log(err);
    }else{
      console.log("Mail sent:");
      console.log(body);
    }
  });
};


// ================ ROUTES ===========


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


var attendingSchema = new Schema({
  email           : { type: String, required: true},
  people          : { type: [Schema.Types.Mixed], required: true },
  msg             : { type: String, required: false, trim:true},
  confirmed       : { type: Boolean, required: true, default: false},
  date_created    : { type: Date, required: true, default: Date.now }
});

var notAttendingSchema = new Schema({
  name       : { type: String, required: true, lowercase: true, trim: true }, //index: { unique: true } might be smurt for avoiding duplicates
  email        : { type: String, required: true},
  confirmed       : { type: Boolean, required: true, default: false},
  date_created    : { type: Date, required: true, default: Date.now }
});

var Accepted = mongoose.model('Accepted', attendingSchema, 'rsvp_accepted');
var Pending = mongoose.model('Pending', attendingSchema, 'rsvp_pending');
var Declined = mongoose.model('Declined', notAttendingSchema, 'rsvp_declined');

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


// ========= GET ========

app.get('/confirm/:id', function (req, res) {

  var id = req.params.id;

  Pending.findOne({_id:id}, function (err, doc) {
    console.log("Looking in Accepted: " + doc);
    if(doc == null){

      Declined.findOne({_id:id}, function (err2, doc2) {
        console.log("Looking in Declined: " + doc2);
        if(err2 || doc2 == null){
          res.sendFile(__dirname + '/error.html');
        }else {
          doc2.confirmed = true;
          doc2.save(function (err4) {
            if(err4) {
              console.log("Could not save!");
            }
          });
          res.sendFile(__dirname + '/confirmed.html');
        }
      });
    }else{

      console.log("DOC:");
      console.log(doc);
      if(err) {
        res.sendFile(__dirname + '/error.html');
      }else{
        doc.confirmed = true;
        addToMailingList(doc.email);
        doc.save(function (err) {
          if(err) {
            console.log("Could not save!");
          }
        });
        res.sendFile(__dirname + '/confirmed.html');
      }
    }
  });
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(expressValidator({
  customValidators: {
    isArray: function(value) {
      return Array.isArray(value);
    },
    isToken: function (val) {
      return (val == config.authKey);
    },
    hasPeople: function(part) {
      console.log(part);
      for(var i in part){
        if(Array.isArray(part) && part[i].participate && _.some(part[i].participate)){
          // Do nothing
        }else{
          return false;
        }
      }
      return true;
    }
  }
}));


// ========= POST =========

app.post('/token', function (req, res) {
  console.log("Someone tries to RSVP");
  var inn = req.body;
  console.log(inn);

  req.assert('token', 'The token is required').notEmpty();
  req.assert('token', 'The token is not valid').isToken();

  var errors = req.validationErrors();

  if(errors){
    console.log("WOPS!");
    res.status(401);
    res.send(errors);
  }else {
    res.status(200);
    res.send("Nice! Token good");
  }

});

app.post('/accept', function (req, res) {
  console.log("Someone tries to RSVP");
  var inn = req.body;
  console.log(inn);

  // TODO: test/assert all important fields!
  req.assert('token', 'The token is required').notEmpty();
  req.assert('token', 'The token is not valid').isToken();

  req.assert('email', 'Email is required').notEmpty();
  req.assert('email', 'A valid email is required').isEmail();
  req.assert('msg', 'Message is optional').optional();
  req.assert('msg', 'Message has a max length').len(0,500);
  req.sanitize('msg').toString();
  req.assert('people', 'People is required').notEmpty();
  req.assert('people', 'People is not valid').hasPeople();

  var errors = req.validationErrors();

  if(errors){
    console.log("WOPS!");
    res.status(400);
    res.send(errors);
  }else {
    console.log("It checks out!");

    createPeopleList(req.body.people);

    res.status(200);
    res.send("Ok");

    /*---------Database calls -------*/

    var newEntity = new Pending({
      email:  req.body.email,
      people: req.body.people,
      msg:    req.body.msg
    });

    newEntity.save(function (err, newEntity) {
      if (err)
        return console.error(err);
      else {
        //console.log("Saved: " + newEntity);
        sendConfirmationMail(newEntity, true);
      }
    });

    /*--------- Everything ok? Send confirmation email -------*/

  }

});


app.post('/decline', function (req, res) {
  console.log("Someone tries to RSVP");
  var inn = req.body;
  console.log(inn);

  req.assert('token', 'The token is required').notEmpty();
  req.assert('token', 'The token is not valid').isToken();

  req.assert('email', 'Email is required').notEmpty();
  req.assert('email', 'A valid email is required').isEmail();

  req.assert('name', 'Name is required and cant be too long').notEmpty().len(1,40);
  req.sanitize('msg').toString();

  var errors = req.validationErrors();

  if(errors){
    console.log("WOPS!");
    res.status(400);
    res.send(errors);
  }else {
    console.log("It checks out!");

    res.status(200);
    res.send("Ok");

    var newEntity = new Declined({
      name:   req.body.name,
      email:  req.body.email
    });

    //*---------Database calls -------*!//

    newEntity.save(function (err, newEntity) {
      if (err)
        return console.error(err);
      else {
        sendConfirmationMail(newEntity, false);
      }
    });
  }
});


app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.sendFile(__dirname + '/error.html');
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});
