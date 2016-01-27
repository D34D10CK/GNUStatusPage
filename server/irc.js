Meteor.publish('messages', () => Messages.find({}, {sort: {timeStamp: -1}, limit: 50}));

var url = 'adams.freenode.net';
var nick = 'CeciEstUnBot';

var client = new irc.Client(url, nick, {
    autoConnect: false,
    floodProtection: true
});

client.connect(5, (input) => {
    console.log('connected to IRC');
    client.join('#gnugeneration', (input) => {
        console.log('joined #gnugeneration');
    })
});

client.addListener('message#gnugeneration', Meteor.bindEnvironment((from, text) => {
    Messages.insert({
        from: from,
        message: text,
        timeStamp: new Date()
    }, (error) => {
        if (error) {
            console.log(error);
        };
    });
}));

client.addListener('pm', Meteor.bindEnvironment((from, text) => {
    if (text == '!mpd') {
        var cursor = Songs.find({}, {sort: {date: -1}});
        var list = cursor.forEach(song => {
            var message = song.title + ' by ' + song.artist + ' on ' + song.album;
            client.say(from, message);
        });
    }
}));
