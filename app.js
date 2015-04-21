var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');


app.set('port', 8880);

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

/*
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
*/
