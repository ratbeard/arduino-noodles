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
var open = require('open');
var request = require('request');




var ratingPollDelay = 3 * 1000;

// DEV
//ratingPollDelay = 1 * 1000;

var state = {
  // itunes state
  currentTrack: {
    name: null,
    rating: null,
  },
  isPlaying: null,
  isPlayingLibrary: null,
  isPaused: null,

  // ROBOT state
  isLedOn: null,
  lastBlinkedForNoRatingAt: null,
  isNoRatingLedBlinking: null,
};

function runApplescript(string, callback) {
  var log = 0;
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
  //console.log('polling')
  //applescript.execFile("itunes-state.applescript", function (err, result) {
    //console.log("XXX!", err, '|||', result)
  //});

  runApplescript('tell application "iTunes" to get player state', function (err, playerState) {
    state.isPlaying = (playerState === 'playing');

    if (!state.isPlaying) {
      state.isPlayingLibrary = false;

      if (state.isLedOn) {
        console.log('[poll] not playing, turning off');
        turnLedOff();
      }
      if (state.isNoRatingLedBlinking) {
        state.isNoRatingLedBlinking = false;
        led1.stop().off();
      }

      return;
    }

    getCurrentTrack(function (err, track) {
      //console.log('[poll] callback - ', err, track);
      if (err) {
        console.log('[poll] got error getting track, not playing library');
        state.isPlayingLibrary = false;
        turnLedOff();
        return;
      }
      state.isPlayingLibrary = true;

      if (!state.isLedOn) {
        console.log('[poll] rgbLed is off but playing now, turning on');
        updateLed();
      }


      if (!state.currentTrack.rating && !state.isNoRatingLedBlinking && state.isPlayingLibrary) {
        state.isNoRatingLedBlinking = true;
        led1.blink(500);
      } else if (state.currentTrack.rating && state.isNoRatingLedBlinking) {
        state.isNoRatingLedBlinking = false;
        led1.stop().off();
      }

      if (track.name !== state.currentTrack.name || track.rating !== state.currentTrack.rating) {
        console.log('[poll] callback - TRACK CHANGED', track);
        state.currentTrack = track;
        turnLedOff();
        setTimeout(function () { updateLed(); }, 1000);
      }
    });
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

function setVolume(volume) {
  runApplescript('tell application "iTunes" to set sound volume to ' + volume, function () {
  });
}

//
function openRapGeniusPage(songStr) {
  var url = 'http://genius.com/search/quick.js?q=' + encodeURIComponent(songStr);
  console.log('openRapGeniusPage() - searching for', songStr);

  request.get(url, function (err, response, body) {
    // Pull out the first url path in the results.  Each row looks like:
    // Walkmen â€“ The Rat|/Walkmen-the-rat-lyrics|76235
    var path = body.match(/\|(\/.*?)\|/)[1];
    //console.log(path);
    var url = 'http://genius.com' + path;
    open(url);
  });
}


function onButton1Pressed() {
  console.log('onButton1Pressed');
  if (state.isPlayingLibrary) {
    bumpCurrentTrackRating(-1);
  } else {
    console.log("whatcha want me 2 do");
  }
}

function onButton1Held() {
  console.log('onButton1Held');
  if (state.isPlayingLibrary) {
    rateCurrentTrackLowAndSkip();
  } else {
    playUnratedPlaylist();
  }
}

function onButton2Pressed() {
  console.log('onButton2Pressed');
  if (state.isPlayingLibrary) {
    bumpCurrentTrackRating(1);
  } else {
    console.log("whatcha want me 2 do");
  }
}

function onButton2Held() {
  console.log('onButton2Held');
  if (state.isPlayingLibrary) {
    skipCurrentTrack();
  } else {
    skipCurrentTrack();
  }
}

function onBothButtonsPressed() {
  console.log('onBothButtonsPressed!!');
  var songStr = "" + state.currentTrack.name;
  openRapGeniusPage(songStr);
}

function onPotentiometerChanged(value) {
  //console.log(value);
  if (value === 0) {
    pause();
  } else if (state.isPaused) {
    resume();
  } else {
    setVolume(value);
  }
}

function pause() {
  state.isPaused = true;
  runApplescript('tell application "iTunes" to pause', function () {});
}

function resume() {
  state.isPaused = false;
  runApplescript('tell application "iTunes" to play', function () {});
}

//
// Heres where the ROBOT starts
//
var five = require("johnny-five");

var board, rgbLed, led1, led2, led3, led4, button1, button2, potentiometer;
var didHoldButton1, didHoldButton2, didPressButton1, didPressButton2;

board = new five.Board();
board.on("ready", onBoardReady);

board.on("close", function() {
  console.log('[board] close() callback');
  process.exit();
});

function onBoardReady() {
  console.log('[board] ready() callback');

  led1 = new five.Led({ pin: 6 });
  led2 = new five.Led({ pin: 7 });
  led3 = new five.Led({ pin: 8 });
  led4 = new five.Led({ pin: 13 });
  rgbLed = new five.Led.RGB({
    pins: [9, 10, 11],
  });
  rgbLed.intensity(15);

  // 0 - 1023
  potentiometer = new five.Sensor({
    pin: 'A0',
    threshold: 1024 / 100,
    freq: 250,
  });
  potentiometer.scale(0, 80); // The max volume we want to go to in itunes
  potentiometer.on("change", function(median) {
    //console.log('[board] potentiometer changed!', this.value, this.raw);
    onPotentiometerChanged(this.value);
  });

  button1 = new five.Button({ pin: 1, invert: true });
  button2 = new five.Button({ pin: 4, invert: true });

  var maybeHandleBothButtonsPressed = function () {
    if (didPressButton1 && didPressButton2) {
      // Clear state so we don't trigger the default actions.
      didPressButton1 = false;
      didPressButton2 = false;
      didHoldButton1 = false;
      didHoldButton2 = false;
      onBothButtonsPressed();
    }
  };

  button1.on('press', function() {
    didPressButton1 = true;
    maybeHandleBothButtonsPressed();
  });
  button2.on('press', function() {
    didPressButton2 = true;
    maybeHandleBothButtonsPressed();
  });

  button1.on("hold", function() {
    if (didPressButton1) {
      didHoldButton1 = true;
    }
  });
  button2.on("hold", function() {
    if (didPressButton2) {
      didHoldButton2 = true;
    }
  });

  button1.on("release", function() {
    if (didHoldButton1) {
      didHoldButton1 = false;
      onButton1Held();
    } else if (didPressButton1) {
      didPressButton1 = false;
      onButton1Pressed();
    } else {
      console.log('button1 released - doing nothing..');
    }
  });
  button2.on("release", function() {
    if (didHoldButton2) {
      didHoldButton2 = false;
      onButton2Held();
    } else if (didPressButton2) {
      didPressButton2 = false;
      onButton2Pressed();
    } else {
      console.log('button2 released - doing nothing..');
    }
  });

  // Start up
  pollCurrentTrack();
  setInterval(pollCurrentTrack, ratingPollDelay);

  board.repl.inject({
    l: rgbLed, l1: led1, l2: led2, l3: led3, l4: led4,
    p: potentiometer,
  });
}

function setLedColor(color) {
  if (!rgbLed) {
    console.log('setLedColor() - no rgbLed');
    return;
  }
  console.log('setLedColor() - setting', color);
  turnLedOn();
  rgbLed.color(color);
}

function turnLedOn() {
  state.isLedOn = true;
  rgbLed.on();
}

function turnLedOff() {
  state.isLedOn = false;
  if (!rgbLed) {
    return;
  }
  rgbLed.off();
}

          //state.lastBlinkedForNoRatingAt = Date.now();
          //var options = {
            //duration: 1000,
            //cuePoints: [0, .5, 1],
            //metronomic: true,
            //keyFrames: [0, 0xff, 0],
            //easing: "inOutSine",
          //};
          //var a = new five.Animation(led1);
          //a.enqueue(options);
          //turnLedOff();
          //setTimeout(function () { turnLedOn(); }, 1000);
