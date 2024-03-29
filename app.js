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
var fs = require('fs');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var config = require('./extra/config'); //config.js file with hard-coded options.

mongoose.connect(config.mongoDB);

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

var list = mailgun.lists(config.mailingList);

var getMailListMembers = function () {

  /*
   List emails in guest list
   list.info(function (err, data) {
   // `data` is mailing list info
   console.log(data);
   });
   */

  list.members().list(function (err, members) {
    //console.log(members.items);

  });
};

var addToMailingList = function (email) {

  var member = [{
    address: email
  }];


  list.members().add({members: member, subscribed: true}, function (err, body) {
    //console.log(body);
    if(err) {
      console.log("Could not add to list");
    } else{
      console.log("Email added to list");
    }
  });
};

var createPeopleList = function (people) {
  var list = '';

  //console.log(people);

  for(i in people){
    if(people[i].participate) {
      list += " – " + capitalizeFirstLetter(people[i].text) + " deltar på ";

      var s = people[i].participate;

      var array = [];
      var counter = 0;

      if(s.fri) {
        array[counter] = "fredag";
        counter ++;
      }
      if(s.sat){
        array[counter] = "lørdag";
        counter ++;
      }
      if(s.sun) {
        array[counter] = "søndag";
      }

      for(i in array){
        if(i == 0){
          list += array[i];

          if(array.length == 3) list += ', ';
          if(array.length == 2) list += ' og ';
        }if(i == 1){
          list += array[i];
          if(array.length > 2) list += " og ";
        }if(i == 2){
          list += array[i];
        }
      }
      list += ".\n";
    }
  }
  return list;
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var getSerializedDetails = function (data) {
  var deltagere = createPeopleList(data.people);
  var hotel = (data.hotel) ? 'Ja' : 'Nei';

  var string = "Epost:\t\t" + data.email+
      "\nHotel:\t\t" + hotel +
      "\nDeltagere:\n" + deltagere +
      "Melding:\n" + data.msg;

  return string;
};

var getAcceptMail = function (data) {

  var hotelInfo = "";
  if(data.hotel){
    hotelInfo = "Du krysset av at du/dere ønsker å bo på Hotel Hesselet. Vi kommer til å kontakte dere på epost med nærmere detaljer innen kort tid.\n"
  }

  var body = 'Hei!\nSå hyggelig at du har anledning til å komme i vårt bryllup!\n' +
      'Vi har foreløpig registrert følgende informasjon: ' + '\n\n' +
      getSerializedDetails(data) +
      "\n\nVennligst bekreft at denne informasjonen stemmer ved å klikke på følgende link:\n\n" +
      "http://martineognikolai.dk/confirm/" + data._id +
      "\n\n" + hotelInfo + "For øvrig informasjon, følg med på nettsiden, der mer informasjon vil bli lagt ut etterhvert. Ellers er det selvfølgelig også bare å ta kontakt med oss på telefon eller mail  martine.nikolai@gmail.com =)" +
      "\n\n Velkommen i september, vi gleder oss til å se dere!" +
      "\n\nKlem fra Martine og Nikolai";

  var acceptEmail = {
    from: 'Martine og Nikolai <martine.nikolai@gmail.com>',
    to: data.email,
    subject: 'Martine og Nikolai: Vennligst bekreft eposten din',
    text: body
  };

  return acceptEmail;

};

var getDeclineMail = function (data) {
  var body = 'Hei ' + capitalizeFirstLetter(data.name.split(" ")[0]) + '!\nDet var leit at du ikke har anledning til å komme i bryllupet vårt. Vennligst bekreft at dette stemmer ved å besøke følgende link:\n\n' +
      "http://martineognikolai.dk/confirm/" + data._id +
      "\n\nMed vennlig hilsen,\nMartine og Nikolai";

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
  hotel           : { type: Boolean, required: false, default: false},
  confirmed       : { type: Boolean, required: true, default: false},
  date_created    : { type: Date, required: true, default: Date.now }
});

var notAttendingSchema = new Schema({
  name       : { type: String, required: true, lowercase: true, trim: true }, //index: { unique: true } might be smurt for avoiding duplicates
  email        : { type: String, required: true},
  confirmed       : { type: Boolean, required: true, default: false},
  date_created    : { type: Date, required: true, default: Date.now }
});

var Pending = mongoose.model('Pending', attendingSchema, 'rsvp_pending');
var Declined = mongoose.model('Declined', notAttendingSchema, 'rsvp_declined');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log("Database connection established");
});

app.set('port', config.port);

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
          res.sendFile(__dirname + '/confirmDeclined.html');
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

var saveFile = function(content, fileName){
  fs.writeFile(__dirname + '/tmp/'+ fileName, content, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
};

app.get('/report/:format', function (req, res) {
  Pending.find().lean().exec(function (err, collection) {
    if(err || collection == null){
      res.send('Well this is embarrassing.');
    }else {

      var format = req.params.format;
      var report = '';
      console.log(format);

      if(format == 'txt') {
        var verbal = '';
        _.each(collection, function (data) {
          verbal += getSerializedDetails(data);
          verbal += '\n\n---\n\n';
        });
        saveFile(verbal, 'verbal.txt');
        //console.log(verbal);
        sendReport(verbal);
        res.send('As you wish master Wayne, a text report has been generated.');

      } else if(format == 'json') {
        var attendants = JSON.stringify(collection);
        saveFile(attendants, 'attendants.json');
        sendReport(attendants);
        res.send('As you wish master Wayne, a JOSN report has been generated.');

      } else{
        res.sendFile(__dirname + '/error.html');
      }
    }
  });
});

var sendReport = function (report) {
  var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  var logMail = {
    from: 'MN Bryllup <martineognikolai@mail.martineognikolai.dk>',
    to: config.email_me,
    subject: 'RSVP report: ' + date,
    text: 'Se vedlagt rapport: \n\n' + report
  };

  mailgun.messages().send(logMail, function (err, body) {
    if (err) {
      console.log("ERROR: couln't send mail! ");
      console.log(err);
    } else {
      console.log("Mail sent:");
    }
  });
};


// ========= POST =========

app.post('/token', function (req, res) {
  console.log(Date.now() + " - someone tries to TOKEN");
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
  console.log(Date.now() + " - someone tries to RSVP_ACCEPT");
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

  req.sanitize('hotel', 'Hotel field is either true or false').toBoolean();
  var errors = req.validationErrors();

  if(errors){
    console.log("WOPS! " + JSON.stringify(errors));
    res.status(400);
    res.send(errors);
  }else {
    console.log("It checks out!");

    res.status(200);
    res.send("Ok");

    /*---------Database calls -------*/

    var newEntity = new Pending({
      email:  req.body.email,
      people: req.body.people,
      msg:    req.body.msg,
      hotel:  req.body.hotel
    });

    newEntity.save(function (err, newEntity) {
      if (err)
        return console.error(err);
      else {
        sendConfirmationMail(newEntity, true);
        //sendLogMail(newEntity);
      }
    });

    /*--------- Everything ok? Send confirmation email -------*/

  }

});


app.post('/decline', function (req, res) {
  getMailListMembers();


  console.log(Date.now() + " - someone tries to RSVP_DECLINE");
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
        //sendLogMail(newEntity);
      }
    });
  }
});

app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  console.log("CSRF ERROR!");
  // handle CSRF token errors here
  res.status(403);
  res.send('form tampered with')
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
