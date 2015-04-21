var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');

var mongoose = require('mongoose');


var debug = false;

// In production
if(!debug){
  mongoose.connect('mongodb://nodeUser:JgKwWLVBYUy2RA8pKRYTg9rN7idRcbYnaGph2Ur@localhost:27314/rsvp')
}else{
  mongoose.connect('mongodb://localhost/bryllup');
}

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log("Database connection established");

  var rsvpSchema = mongoose.Schema({
    name: String,
    email: String
  });

  var Feedback = mongoose.model('Feedback', rsvpSchema);

  var test1 = new Feedback({
    name: 'Siri',
    email: 's.ho@f,.com'
  });

  test1.save(function (err, test1) {
    if(err) return console.error(err);
    console.log("something saved");
  });

});

app.set('port', 3000);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


app.post('/', function (req, res) {
  console.log("Someone tries to RSVP");
  var inn = req.body;
  res.json(inn);
  console.log(inn);
});
