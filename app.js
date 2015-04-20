var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var mongo = require('mongodb');
var monk = require('monk');


var debug = true;

// In production
if(!debug){
  var db = monk('localhost:27314/bryllup', {
    username : 'nodeUser',
    password : 'grLeTtkq6AZv4bWD3hGkg8@8vuM;/boC#mY2D&.mv'
  });
}else{
  var db =  monk('localhost:27017/bryllup');
}

app.set('port', 8880);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.use(express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));


app.get('/', function(req, res){
  //res.sendFile(__dirname + '/index.html');

  var collection = db.get("rsvp");
  collection.find({}, function (e, docs) {
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