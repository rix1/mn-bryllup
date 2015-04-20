var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var MongoClient = require('mongodb').MongoClient;

var debug = false;
var mongodb = null;

// In production
if(!debug){
  MongoClient.connect('mongodb://localhost:27314/rsvp', function (err, db) {
    if(err) {
      console.log("ConnectionERRROR:\n" + err);
    }

    db.authenticate('nodeUser', 'grLeTtkq6AZv4bWD3hGkg8@8vuM;/boC#mY2D&.mv', function (err, result) {
      if(err) {
        console.log("AUTH ERROR\n" + err);
      }
      console.log("WHAT? " + result);
      var collection = db.collection('attendees');


      mongodb = db;

      collection.find().toArray(function (err, docs) {
        console.log(docs);
      });
    });

  });


}

app.set('port', 3000);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));


app.get('/', function(req, res){
  //res.sendFile(__dirname + '/down.html');

  var collection = mongodb.collection("attendees");

  collection.find().toArray(function (err, docs) {
    res.json(docs);
  });

});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('input fields', function(data){
    console.log('data received: '+ data.owl + " " + data.xml);
    saveFile(data.xml);
    runVerbalizor(data.owl, data.xml);
  })
});


app.use(function (req, res, next) {
  req.db = db;
  next();
});
