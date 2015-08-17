//original script http://goo.gl/YVwl3u
//sound from https://www.freesound.org/people/Puniho/sounds/115560/


var fs = require("fs");
//var groove = require('groove');




function tryAgain() {
  /*var playlist = groove.createPlaylist();
  var player = groove.createPlayer();

  groove.open("test_unit/try-again.mp3", function(err, file) {
    if (err) throw err;

    playlist.insert(file);

    player.attach(playlist, function(err) {
    });

    playlist.play();

    player.on('nowplaying', function() {
      var current = player.position();
      if (!current.item) {
        playlist.clear();
        file.close(function(){});
      }
    });
  });*/
}


var run = false;
process.argv.forEach(function (val, index, array) {
  if (index == 2 && val == "-nodemon") {
    run = true;
  }
});


if (run) {
  //setup nodemon
  console.log("-------------------------------");
  console.log("Launching nodemon to wrap tests");
  console.log("-------------------------------");
  var nodemon = require('nodemon');
  nodemon("run_tests.js").on('crash', function () {
    tryAgain();
  });
  return;
} 

//setup logging on console
var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});
requirejs(["./lib/log/LoggerManager","./lib/log/console/LoggerProvider"],
    function(LoggerManager,LoggerProvider) {
  LoggerManager.setLoggerProvider(LoggerProvider);
});

var diveSync = require("diveSync");
var nodeUnit = require('nodeunit');

//read the list of folders under test
var directoriesToTest = ['test_unit'];
diveSync(directoriesToTest[0], {directories:true}, function(err, file) {
    if (fs.lstatSync(file).isDirectory()) {
        directoriesToTest.push(file);
    }
});

//start the tests
nodeUnit.reporters.default.run(directoriesToTest,null,function(err) {
  if (err) {
    tryAgain();
  } 
});

process.on('uncaughtException', function (err) {
  console.log('Uncaught exception: ' + err);
  tryAgain();
});
