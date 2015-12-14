Meteor.publish('song', () => {
    return Song.find();
});

var url = 'mpd.gnugen.ch'
var port = 6600;

var net = Npm.require('net');
var socket = net.createConnection(port, url);
socket.setEncoding('utf8');

var waitingForEvent = false;

socket.on('data', Meteor.bindEnvironment((data) => {
    if (data.includes('OK')) {
        if (!waitingForEvent) {
            socket.write('idle player\r\n');
            waitingForEvent = true;
        } else {
            socket.write('currentsong\r\n');
            waitingForEvent = false;
        } 
    } 

    if (data.startsWith('file:')) {
        var artist = data.slice(data.indexOf('Artist: ') + 'Artist: '.length, data.indexOf('\n', data.indexOf('Artist: ')));
        var album = data.slice(data.indexOf('Album: ') + 'Album: '.length, data.indexOf('\n', data.indexOf('Album: ')));
        var title = data.slice(data.indexOf('Title: ') + 'Title: '.length, data.indexOf('\n', data.indexOf('Title: ')));
        
        Song.upsert({_id: 1}, {_id: 1, artist: artist, album: album, title: title});
    }
}));
