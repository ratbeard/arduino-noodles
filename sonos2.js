var five = require("johnny-five");
var board, sonos;

board = new five.Board();


// https://github.com/julianduque/j5-songs/tree/master/lib/songs
songs = {
  pew: {
    song: [
      ["G5", 1/4],
      ["F5", 1/4],
      ["E5", 1/4],
      ["D5", 1/4],
      ["C5", 1/4],
      ["B5", 1/4],
      ["A5", 1/4],
      [null, 1/2],
    ],
    tempo: 300
  },
  mario1: {
    song: [
      ["E5", 1/4],
      [null, 1/4],
      ["E5", 1/4],
      [null, 3/4],
      ["E5", 1/4],
      [null, 3/4],
      ["C5", 1/4],
      [null, 1/4],
      ["E5", 1/4],
      [null, 3/4],
      ["G5", 1/4],
      [null, 7/4],
      ["G4", 1/4],
      [null, 7/4]
    ],
    tempo: 200
  }
};

board.on("ready", function() {

  sonos = new SonosApi();


  //myLed = new five.Led(9)

  // try "on", "off", "toggle", "brightness",
  // "fade", "fadeIn", "fadeOut", 
  // "pulse", "strobe", 
  // "stop" (stops strobing, pulsing or fading)

  //myLed.pulse();

  var button1 = new five.Button({ pin: 1, invert: true });
  var button2 = new five.Button({ pin: 4, invert: true });
  var potentiometer = new five.Sensor({ pin: "A0", freq: 250, threshold: 2 });
  var piezo = new five.Piezo(12);
  //var lightSensor = new five.Sensor({ pin: "A1" });

  piezo.play(songs.mario1);

  //lightSensor.on("data", function() {
    //console.log('e', this.value);
  //});

  button1.on("down", function() {
    sonos.nextTrack();
  });

  button2.on("down", function() {
    sonos.togglePlay();
  });

  // Scale volume from 0 to 50
  potentiometer.scale(0, 50).on("change", function() {
    sonos.setVolume(this.value);
  });

  board.repl.inject({
    button1: button1,
    button2: button2,
    potentiometer: potentiometer,
  });
});


// https://github.com/bencevans/node-sonos/blob/master/lib/sonos.js
var Sonos = require('sonos');

var noop = function() {};
var log = function() {
  console.log.apply(console, arguments);
};

function SonosApi() {
  this._lastVolumePercent = null;
  this.findPlayer();
}

SonosApi.prototype.findPlayer = function() {
  Sonos.search(function(device, model) {
    if(/^BR/.test(model)) {
      return console.log('ignoring bridge device', device, model);
    }

    console.log('found device', device, model);
    device.currentTrack(function (err, track) {
      console.log('currentTrack', track);
    });
    this.player = device;
  }.bind(this));
};

SonosApi.prototype.togglePlay = function() {
  console.log('togglePlay');

  this.player.getCurrentState(function(err, state) {
    if(err) {
      return console.error("Error", err);
    }
    console.log('current state', state);

    if(state === 'playing') {
      this.player.pause(log);
    } else {
      this.player.play(log);
    }
  }.bind(this));
};

SonosApi.prototype.nextTrack = function() {
  console.log('nextTrack');
  this.player.next(log);

  this.player.getCurrentState(function(err, state) {
    if(state !== 'playing') {
      this.player.play(log);
    }
  }.bind(this));
};

SonosApi.prototype.setVolume = function(value) {
  console.log("setVolume", value);
  this.player.setVolume(value, noop);
};
