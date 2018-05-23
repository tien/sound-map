var socket = io();
var map;
var tempAudio = 0;
var ready = false;

var baseLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY3JhenljYXQ5eCIsImEiOiJjamhpZ254bjAwZ2xqMzZudXhleG8xemhlIn0.zSQ57mVkSHuQ6c6xH6ZWZA', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 30,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
});

var cfg = {
    "radius": 0.00002,
    "maxOpacity": .8,
    "scaleRadius": true,
    "useLocalExtrema": false,
    latField: 'latitude',
    lngField: 'longitude',
    valueField: 'decibels'
};

var heatmapLayer = new HeatmapOverlay(cfg);

var count = 0;

function watchSuccess(pos) {
    var crd = pos.coords;
    longitude = crd.longitude;
    latitude = crd.latitude;
    if (count == 0) {
        var map = new L.Map('map', {
            center: new L.LatLng(latitude, longitude),
            zoom: 18,
            layers: [baseLayer, heatmapLayer]
        });
        ready = true
    }
    count = count + 1;
}

function watchError(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
}

var watchId = navigator.geolocation.watchPosition(watchSuccess, watchError);

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
if (navigator.getUserMedia) {
    navigator.getUserMedia({
            audio: true
        },
        function (stream) {
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            javascriptNode = audioContext.createScriptProcessor(0, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            javascriptNode.onaudioprocess = function () {
                var array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                var values = 0;
                var length = array.length;
                for (var i = 0; i < length; i++) {
                    values += (array[i]);
                }

                var average = values / length;
                if (ready) {
                    tempAudio = Math.round(average);
                }
            } // end fn stream
        },
        function (err) {
            console.log("The following error occured: " + err.name)
        });
} else {
    console.log("getUserMedia not supported");
}

setInterval(function(){
    newData = {
        latitude: latitude,
        longitude: longitude,
        decibels: tempAudio
    }
    socket.emit('soundUpdate', newData);
},1000)

socket.on('soundBroadcast', function (data) {
    if (ready) {
        heatmapLayer.setData(data);
    }
})