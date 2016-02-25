// https://github.com/dtinth/JXA-Cookbook/wiki
// osx js examples.  Sounds like cant get current track from a stream consistently
//
// https://github.com/jgautier/firmata
// Underlying library.
//
// http://playground.arduino.cc/Code/CmdMessenger
// Alternative rpc mechanism
//
// Not liking the 11 second wait to reconnect.  (But faster than time to compile..)
require('colors');
var util = require('util');
var applescript = require('applescript');

var ratingPollDelay = 3 * 1000;

var state = {
  currentTrack: {
    name: null,
    rating: null,
  },
};

function runApplescript(string, callback) {
  var log = 1;
  if (log) console.log('[]', string);
  applescript.execString(string, function (err, result) {
    if (err) {
      console.log(('[] ' + String(err)).red);
      return callback(err);
    }
    if (log) console.log(('[] ' + String(result)).green);
    callback(null, result);
  });
}

function getCurrentTrack(callback) {
  runApplescript('tell application "iTunes" to get the name of the current track', function (err, name) {
    if (err) {
      return callback(err);
    }
    runApplescript('tell application "iTunes" to get the rating of the current track', function (err, rating) {
      if (err) {
        return callback(err);
      }
      var result = { name: name, rating: +rating };
      callback(null, result);
    });
  });
}

function pollCurrentTrack() {
  getCurrentTrack(function (err, track) {
    //console.log('[poll] callback - ', err, track);
    if (err) {
      turnLedOff();
      return;
    }

    if (track.name !== state.currentTrack.name || track.rating !== state.currentTrack.rating) {
      console.log('[poll] callback - TRACK CHANGED', track);
      state.currentTrack = track;
      updateLed();
    }
  });
}

function ratingToColor(rating) {
  if (rating < 1) {         // no rating
    return '#FF0000';       // red
  } else if (rating < 21) { // 1 star
    return '#E50008';       // purple
  } else if (rating < 41) { // 2 stars
    return '#504500';       // orange
  } else if (rating < 61) { // 3 stars
    return '#102262';       // blue
  } else if (rating < 81) { // 4 stars
    return '#';       // blue green
  } else {                  // 5 stars!
    return '#75e300';       // green
  }
}

function ratingToColor(rating) {
  if (rating < 1) {         // no rating
    return '#FF0000';       // purple
  } else if (rating < 21) { // 1 star
    return '#CACA06';       // yellow
  } else if (rating < 41) { // 2 stars
    return '#00FF00';       // green
  } else if (rating < 61) { // 3 stars
    return '#0000FF';       // blue
  } else if (rating < 81) { // 4 stars
    return '#00FFFF';       // light blue
  } else {                  // 5 stars!
    return '#111111';       // dim
  }
}

function ratingToColor(rating) {
  if (rating < 1) {         // no rating
    return '#FF0000';       // red
  } else if (rating < 21) { // 1 star
    return '#110000';       // light red
  } else if (rating < 41) { // 2 stars
    return '#111111';       // white
  } else if (rating < 61) { // 3 stars
    return '#737D00';       // yellow
  } else if (rating < 81) { // 4 stars
    return '#0000FF';       // blue
  } else {                  // 5 stars!
    return '#00FF00';       // green
  }
}

function updateLed() {
  setLedColor(ratingToColor(state.currentTrack.rating));
}


function bumpCurrentTrackRating(amount) {
  var rating = state.currentTrack.rating || 0;
  rating += amount * 20;
  setCurrentTrackRating(rating);

  // update light immediately
  state.currentTrack.rating = rating;
  updateLed();
}

function setCurrentTrackRating(rating) {
  runApplescript('tell application "iTunes" to set the rating of the current track to ' + rating, function (err, stdout) {
  });
}

function rateCurrentTrackLowAndSkip() {
  runApplescript('tell application "iTunes" to set the rating of the current track to 20', function (err, stdout) { 
    if (err) {
      return callback(err);
    }
    runApplescript('tell application "iTunes" to play next track', function (err, stdout) { 
      if (err) {
        return callback(err);
      }
    });
  });
}

function skipCurrentTrack() {
  runApplescript('tell application "iTunes" to play next track', function (err, stdout) { 
  });
}

function playUnratedPlaylist() {
  runApplescript('tell application "iTunes" to play playlist "unrated"', function (err, stdout) {
    //console.log('[] callback - ', err, stdout);
    if (err) {
      return callback(err);
    }
  });
}


//
//
//
var five = require("johnny-five");

var board = new five.Board();
var led, button1, button2, isHoldingButton1, isHoldingButton2;

board.on("ready", onBoardReady);
board.on("close", function() {
  process.exit();
});

function onBoardReady() {
  console.log('[board] ready() callback - ');

  led = new five.Led.RGB({
    pins: { red: 9, green: 10, blue: 11 }
  });
  button1 = new five.Button({ pin: 1, invert: true });
  button2 = new five.Button({ pin: 4, invert: true });

  //button1.on("release", function() {
    //console.log( "Button released" );
  //});

  button1.on("release", function() {
    console.log( "Button 1 pressed" );
    if (isHoldingButton1) {
      rateCurrentTrackLowAndSkip();
      isHoldingButton1 = false;
    } else {
      bumpCurrentTrackRating(-1);
    }
  });

  button2.on("release", function() {
    console.log( "Button 2 pressed" );
    if (isHoldingButton2) {
      //playUnratedPlaylist();
      skipCurrentTrack();
      isHoldingButton2 = false;
    } else {
      bumpCurrentTrackRating(1);
    }
  });

  button1.on("hold", function() {
    console.log( "Button 1 held" );
    isHoldingButton1 = true;
  });

  button2.on("hold", function() {
    console.log( "Button 2 held" );
    isHoldingButton2 = true;
  });

  pollCurrentTrack();
  setInterval(pollCurrentTrack, ratingPollDelay);

  board.repl.inject({
    led: led,
  });
}

function setLedColor(color) {
  if (!led) {
    console.log('setLedColor() - no led');
    return;
  }
  console.log('setLedColor() - setting', color);
  led.on();
  led.color(color);
}

function turnLedOff() {
  if (!led) {
    return;
  }
  led.off();
}



//var glob = require("glob");
//var SerialPort = require("serialport").SerialPort;

//var files = glob.sync("/dev/tty.usbmodem*", { nonull: true });

//if(files.length < 1) {
  //return console.error("No /dev/tty.usbmodem files found! :(")
//}
//if(files.length > 1) {
  //return console.error("Multiple /dev/tty.usbmodem files found! :(")
//}

//var path = files[0];
//console.log("Found serial device: ", path);

//var serial = new SerialPort(path);

//// Listen to the arduino serial connection input.
//// We get messages in the form:
////
//// V<num> - where num is between 0 and 100, and indicates the percent of volume.
////          We treat this as a percent of MaxVolume, as 100% volume on the sonos is
////          too loud, dawg.
//// B1     - button 1 was pressed.  Treat this as pause/play.
//// B2     - button 2 was pressed.  Tread this as next track.
//serial.on('open', function() {
  //serial.on('data', onSerialData)
//})

//function onSerialData(data) {
  //data = String(data)
  //console.log("Read: ", data)

  //if(data[0] == 'V') {
    //var percent = +data.slice(1) / 100;
    //console.log(percent);
  //}
  //else if(data == "B1") {
    //console.log('button 1')
  //}
  //else if(data == "B2") {
    //console.log('button 2')
  //}
  //else {
    //console.log("What the bang?", data)
  //}
//}


