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
var delayBetweenNoRatingBlinks = 30 * 1000;

// DEV
//ratingPollDelay = 1 * 1000;
//delayBetweenNoRatingBlinks = 5 * 1000;

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
  runApplescript('tell application "iTunes" to get player state', function (err, playerState) {
    state.isPlaying = (playerState === 'playing');

    if (!state.isPlaying) {
      state.isPlayingLibrary = false;

      if (state.isLedOn) {
        console.log('[poll] not playing, turning off');
        turnLedOff();
      }
      return;
    }

    getCurrentTrack(function (err, track) {
      //console.log('[poll] callback - ', err, track);
      if (err) {
        console.log('[poll] got error getting track, not playing library')
        state.isPlayingLibrary = false;
        turnLedOff();
        return;
      }
      state.isPlayingLibrary = true;

      if (!state.isLedOn) {
        console.log('[poll] led is off but playing now, turning on');
        updateLed();
      }


      if (!state.currentTrack.rating) {
        if ((Date.now() - state.lastBlinkedForNoRatingAt) > delayBetweenNoRatingBlinks) {
          state.lastBlinkedForNoRatingAt = Date.now();
          turnLedOff();
          setTimeout(function () { turnLedOn(); }, 1000);
        }
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



function onButton1Pressed() {
  if (state.isPlayingLibrary) {
    bumpCurrentTrackRating(-1);
  } else {
    console.log("whatcha want me 2 do");
  }
}

function onButton1Held() {
  if (state.isPlayingLibrary) {
    rateCurrentTrackLowAndSkip();
  } else {
    playUnratedPlaylist();
  }
}

function onButton2Pressed() {
  if (state.isPlayingLibrary) {
    bumpCurrentTrackRating(1);
  } else {
    console.log("whatcha want me 2 do");
  }
}

function onButton2Held() {
  if (state.isPlayingLibrary) {
    skipCurrentTrack();
  } else {
    skipCurrentTrack();
  }
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

var board, led, button1, button2, potentiometer;
var isHoldingButton1, isHoldingButton2;

board = new five.Board();
board.on("ready", onBoardReady);

board.on("close", function() {
  console.log('[board] close() callback');
  process.exit();
});

function onBoardReady() {
  console.log('[board] ready() callback');

  led = new five.Led.RGB({
    pins: [9, 10, 11],
  });
  led.intensity(15);

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

  button1.on("release", function() {
    if (isHoldingButton1) {
      isHoldingButton1 = false;
      onButton1Held();
    } else {
      onButton1Pressed();
    }
  });
  button2.on("release", function() {
    console.log( "Button 2 pressed" );
    if (isHoldingButton2) {
      isHoldingButton2 = false;
      onButton2Held();
    } else {
      onButton2Pressed();
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

  // Start up
  pollCurrentTrack();
  setInterval(pollCurrentTrack, ratingPollDelay);

  board.repl.inject({
    led: led,
    l: led,
    p: potentiometer,
  });
}

function setLedColor(color) {
  if (!led) {
    console.log('setLedColor() - no led');
    return;
  }
  console.log('setLedColor() - setting', color);
  turnLedOn();
  led.color(color);
}

function turnLedOn() {
  state.isLedOn = true;
  led.on();
}

function turnLedOff() {
  state.isLedOn = false;
  if (!led) {
    return;
  }
  led.off();
}

