Meteor.publish('song', () => {
    return Song.find();
});

var url = 'mpd.gnugen.ch'
var port = 6600;

var net = Npm.require('net');

var connectToMPD = function () {
    var socket = new net.Socket({allowHalfOpen: false});
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
            var artist;
            var album;
            var title;
            if (data.includes('Artist:') && data.includes('Album:') && data.includes('Title:')) {
                artist = data.slice(data.indexOf('Artist: ') + 'Artist: '.length, data.indexOf('\n', data.indexOf('Artist: ')));
                album = data.slice(data.indexOf('Album: ') + 'Album: '.length, data.indexOf('\n', data.indexOf('Album: ')));
                title = data.slice(data.indexOf('Title: ') + 'Title: '.length, data.indexOf('\n', data.indexOf('Title: ')));
            } else {
                title = data.slice(data.indexOf('file: ') + 'file: '.length, data.indexOf('\n', data.indexOf('file: ')));
                title = title.slice(title.lastIndexOf('/') + 1);
                title = title.slice(0, title.lastIndexOf('.'));
                if (title.startsWith('youtube')) {
                    title = title.replace('youtube_', '');
                    album = 'Youtube';
                    artist = '— ';
                } else {
                    album = '— ';
                    artist = '— ';
                }
            }

            Song.upsert({_id: 1}, {_id: 1, artist: artist, album: album, title: title});
        }
    }));

    socket.on('close', Meteor.bindEnvironment(() => {
        console.log('retrying to connect to MPD in 10 secs');
        socket.destroy();
        setTimeout(Meteor.bindEnvironment(() => {
            connectToMPD();
        }), 10000);
    }));

    socket.on('error', () => {
        console.log('disconnected from MPD');
    });

    socket.connect(port, url, () => {
        socket.setKeepAlive(true, 10000);
        console.log('connected to MPD');
    });
}

connectToMPD();
