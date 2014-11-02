// TODO - B2
// TODO - debounce button
var glob = require("glob");
var SerialPort = require("serialport").SerialPort;
var SonosDiscovery = require('sonos-discovery');

var files = glob.sync("/dev/tty.usbmodem*", { nonull: true });

if(files.length < 1) {
  return console.error("No /dev/tty.usbmodem files found! :(")
}
if(files.length > 1) {
  return console.error("Multiple /dev/tty.usbmodem files found! :(")
}

var path = files[0];
console.log("Found serial device: ", path);

var serial = new SerialPort(path);

var maxVolume = 50;
var SonosDiscovery = require('sonos-discovery');
var discovery = new SonosDiscovery({ port: 5005, cacheDir: './cache' });
var player = discovery.getAnyPlayer();
discovery.on('group-volume', init);
console.log(discovery)

// Listen to the arduino serial connection input.
// We get messages in the form:
//
// V<num> - where num is between 0 and 100, and indicates the percent of volume.
//          We treat this as a percent of MaxVolume, as 100% volume on the sonos is
//          too loud, dawg.
// B1     - button 1 was pressed.  Treat this as pause/play.
// B2     - button 2 was pressed.  Tread this as next track.
serial.on('open', function() {
  serial.on('data', onSerialData)
})

function onSerialData(data) {
  data = String(data)
  console.log(data)

  if(data[0] == 'V') {
    var percent = +data.slice(1) / 100;
    setVolume(maxVolume * percent);
  }
  if(data == "B1") {
    playOrPause()
  }
  if(data == "B2") {
    nextTrack()
  }
  else {
    console.log("What the bang?", data)
  }
}

function init() {
  player = discovery.getAnyPlayer();
}

function setVolume(volume) {
  player.setVolume(volume)
}

function playOrPause() {
  if (player.state.currentState == "PLAYING") {
    player.pause()
  } else {
    player.play()
  }
}

function nextTrack() {

}
