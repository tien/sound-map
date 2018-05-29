var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis')

var heatmapData = [];

app.use(express.static('public'))
app.get('/', function (req, res) {
    res.render('index')
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('soundUpdate', function (data) {
        console.log(data)
        let newData = {
            latitude: data.latitude,
            longitude: data.longitude,
            decibels: data.decibels
        }
        for (let [index, o] of heatmapData.entries()) {
            if (o.latitude == newData.latitude && o.longitude == newData.longitude) {
                heatmapData.splice(index);
            }
        }
        heatmapData.push(newData);
        io.emit('soundBroadcast', {
            max: 70,
            data: heatmapData
        });
    });
})

var port = process.env.PORT || 3000;

http.listen(port);