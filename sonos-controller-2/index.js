var five = require("johnny-five");
var board

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
  var led1 = new five.Led({ pin: 6 });
  var led2 = new five.Led({ pin: 7 });
  var led3 = new five.Led({ pin: 8 });
  var led4 = new five.Led({ pin: 13 });

  //var lightSensor = new five.Sensor({ pin: "A1" });

  piezo.play(songs.mario1);

  //lightSensor.on("data", function() {
    //console.log('e', this.value);
  //});

  button1.on("down", function() {
  });

  button2.on("down", function() {
  });

  // Scale volume from 0 to 50
  potentiometer.scale(0, 50).on("change", function() {
  });

  board.repl.inject({
    button1: button1, button2: button2,
    potentiometer: potentiometer,
    led1: led1, led2: led2, led3: led3, led4: led4,
  });
});

