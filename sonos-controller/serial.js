var SerialPort = require("serialport").SerialPort;
var SonosDiscovery = require('sonos-discovery');

var path = "/dev/tty.usbmodem1451";
var serial = new SerialPort(path);

serial.on('open', function() {
  console.log('open!');
  serial.on('data', function(data) {
    data = String(data)
    console.log('data:', data);
    if(data[0] == 'V') {
      var percent = +data.slice(1) / 100;
      var volume = 40 * percent
      console.log( volume )
      player.setVolume(volume);
      //toggleVolume()
    }
    if(data == "B1") {
      togglePlay()
    }
    if(data == "B2") {

    }
  });
});

function togglePlay() {
  if (player.state.currentState == "PLAYING") {
    player.pause();
  } else {
    player.play();
  }
}

var player;
var vol = 4;

function init() {
  player = discovery.getAnyPlayer();
}

function toggleVolume() {
  vol = vol == 4 ? 40 : 4;
  player.setVolume(vol);
}

var SonosDiscovery = require('sonos-discovery');
var discovery = new SonosDiscovery({ port: 5005, cacheDir: './cache' });
var player = discovery.getAnyPlayer();


discovery.on('group-volume', init);



console.log(discovery)

