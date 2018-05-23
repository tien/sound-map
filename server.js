var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

heatmapData = {max: 75, data:[]};
app.use(express.static('public'))
app.get('/', function (req, res) {
    res.render('index')
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('soundUpdate', function (data) {
        var found = false;
        for (o of heatmapData.data) {
            if (o.latitude == data.latitude && o.longitude == data.longitude) {
                o.decibels == data.decibels;
                found = true;
            }
        }
        if (!found) {
            heatmapData.data.push({latitude:data.latitude, longitude:data.longitude, decibels: data.decibels});
        }
        console.log(heatmapData.data)
        io.emit('soundBroadcast', heatmapData);
    });
})


http.listen(3000)
      