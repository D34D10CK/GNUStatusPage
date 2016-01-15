Meteor.publish('messages', () => {
    return Messages.find({}, {sort: {timeStamp: -1}, limit: 50});
});

var url = 'adams.freenode.net';
var nick = 'CeciEstUnBot'

var client = new irc.Client(url, nick, {
    autoConnect: false
});

client.connect(5, (input) => {
    console.log('connected to IRC');
    client.join('#gnugeneration', (input) => {
        console.log('joined #gnugeneration');
    })
});

client.addListener('message#gnugeneration', Meteor.bindEnvironment((from, text) => {
    if (text.startsWith(nick)) {
        if (text.includes('!mpd')) {
            var cursor = Songs.find({}, {sort: {$natural: -1}});
            cursor.forEach(song => {
                var message =  song.title + ' by ' + song.artist + ' on ' + song.album;
                client.ctcp(from, 'privmsg', message);
            });
        }
    }

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
