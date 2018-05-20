

// http://172.23.52.113:4567/sound?
var tempAudio = 0;
var latitude;
var longitude;
var locationName;
var count = 0;
var map;
var heatMap;

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

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

                var result = Math.round(average);
                tempAudio = result;
            } // end fn stream
        },
        function (err) {
            console.log("The following error occured: " + err.name)
        });
} else {
    console.log("getUserMedia not supported");
}

function watchSuccess(pos) {
    var crd = pos.coords;
    longitude = crd.longitude;
    latitude = crd.latitude;
    if (count == 0) {
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 20,
            center: { lat: latitude, lng: longitude }
        });
        heatmap = new HeatmapOverlay(map,
            {
                // radius should be small ONLY if scaleRadius is true (or small radius is intended)
                "radius": 0.00002,
                "maxOpacity": 0.5,
                // scales the radius based on map zoom
                "scaleRadius": true,
                // if set to false the heatmap uses the global maximum for colorization
                // if activated: uses the data maximum within the current map boundaries 
                //   (there will always be a red spot with useLocalExtremas true)
                "useLocalExtrema": false,
                // which field name in your data represents the latitude - default "lat"
                latField: 'latitude',
                // which field name in your data represents the longitude - default "lng"
                lngField: 'longitude',
                // which field name in your data represents the data value - default "value"
                valueField: 'decibels'
            }
        );
        count = count + 1;
    }
}

function watchError(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
}

var watchId = navigator.geolocation.watchPosition(watchSuccess, watchError, { enableHighAccuracy: true });

function postLocationName(locationName) {
    var position = { locationName: locationName, location: { latitude: latitude, longitude: longitude } };
    if (latitude && longitude && locationName) {
        console.log(position)
        $.ajax({
            type: 'POST',
            url: 'http://172.23.52.113:4567/newLocation',
            header: { "type": "location" },
            data: JSON.stringify(position),
            success: function () {
            }
        });
    }
}
function postStudyLocation() {
    var geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(latitude, longitude);
    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
        postLocationName(results[0].formatted_address);
    });
}

function setMarker(locationData) {

    let data = JSON.parse(locationData);
    
            for(o of data){
                try{
                    var infowindow = new google.maps.InfoWindow({
                        content: o.locationName
                      });
                    let marker = new google.maps.Marker({
                        position: {lat:o.location.latitude,lng:o.location.longitude},
                        map: map,
                        title: o.locationName
                    });
                    marker.addListener('click', function() {
                        infowindow.open(map, marker);
                      }); 
                }catch(e){

                }  
            }   
}

setInterval(function () {
    if (latitude && longitude && tempAudio) {
        let firstData = { decibels: tempAudio, location: { latitude: latitude, longitude: longitude } }
        $.ajax({
            type: 'POST',
            url: 'http://172.23.52.113:4567/newSound',
            header: { "type": "location" },
            data: JSON.stringify(firstData),
        })
        sleep(500);
        $.get("http://172.23.52.113:4567/sounds", function (soundData, status) {
            let data = JSON.parse(soundData);
            let secondData = []
            for (o of data) {
                try {
                    secondData.push({ latitude: o.location.latitude, longitude: o.location.longitude, decibels: o.decibels })
                } catch(e){}
            }
            let finalData = { max: 65, data: secondData }
            heatmap.setData(finalData)
        });
        $.get("http://172.23.52.113:4567/locations", function(locationData,status){
            setMarker(locationData,status)
        });
        $.get("http://172.23.52.113:4567/features", function (data, status) {
            // console.log(data);
        });
    };
}
    , 1000)







// heatmap layer





