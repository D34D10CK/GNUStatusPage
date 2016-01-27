Meteor.publish('song', () => Songs.find({}, {sort: {date: -1}, limit: 1}));

var url = 'mpd.gnugen.ch'
var port = 6600;

var net = Npm.require('net');

var connectToMPD = function() {
    var socket = new net.Socket({allowHalfOpen: false});
    socket.setEncoding('utf8');

    var waitingForEvent = false;
    socket.on('data', Meteor.bindEnvironment(data => {
        if (data.includes('OK')) {
            if (!waitingForEvent) {
                socket.write('idle player\r\n');
                waitingForEvent = true;
            } else {
                socket.write('currentsong\r\n');
                waitingForEvent = false;
            } 
        } 

        if (data.startsWith('file: ')) {
            var artist = '—';
            var album = '—';
            var title = '—';

            if (data.includes('Artist: ')) {
                artist = getValue(data, 'Artist: ');
            }
            if (data.includes('Album: ')) {
                album = getValue(data, 'Album: ');
            }
            if (data.includes('Name: ')) {
                album = getValue(data, 'Name: ');
            }
            if (data.includes('Title: ')) {
                title = getValue(data, 'Title: ');
            }

            if (artist == '—' && album == '—' && title == '—') {
                title = getValue(data, 'file: ');
                title = title.slice(title.lastIndexOf('/') + 1);
                title = title.slice(0, title.lastIndexOf('.'));

                if (title.startsWith('youtube_')) {
                    title = title.replace('youtube_', '');
                    album = 'Youtube';
                }
            }

            if (Songs.find().count() == 20) {
                var first = Songs.findOne({}, {sort: {date: 1}});
                Songs.remove(first);
            }

            var last = Songs.findOne({}, {sort: {date: -1}});
            if (last.artist != artist && last.album != album && last.title != title) {
                Songs.insert({artist, album, title, date: new Date()});                
            }
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

var getValue = function(string, value) {
    return string.slice(string.indexOf(value) + value.length, string.indexOf('\n', string.indexOf(value)));
}

connectToMPD();
