Messages = new Mongo.Collection('messages');
TimeTables = new Mongo.Collection('timeTables');
Song = new Mongo.Collection('song');

if (Meteor.isClient) {
    Meteor.setInterval(() => {
        Session.set('clock', moment(new Date()).format('HH:mm:ss'));
    }, 1000);

    Meteor.subscribe('song');
    Meteor.subscribe('timeTables');
    Meteor.subscribe('messages');

    Template.mpd.helpers({
        song: function() {
            return Song.findOne();
        }
    });

    Template.timeTables.helpers({
        renens: function() {
            return TimeTables.find({destination: "renens"}, {sort: {id: 1}});
        },
        flon: function() {
            return TimeTables.find({destination: "flon"}, {sort: {id: 1}});
        }
    });

    Template.irc.helpers({
        messages: function() {
            return Messages.find({}, {sort: {timeStamp: -1}});
        }
    });

    Template.body.helpers({
        clock: function() {
            return Session.get('clock');
        }
    });

    Template.registerHelper('formatDate', (date) => {
        return moment(date).format('HH:mm');
    });
}

if (Meteor.isServer) {
    //----------- IRC ----------------
    Meteor.publish('messages', () => {
        return Messages.find({}, {sort: {timeStamp: -1}, limit: 50});
    });

    var client = new irc.Client('adams.freenode.net', 'CeciEstUnBot', {
        autoConnect: false
    });

    client.connect(5, (input) => {
        console.log('connected');
        client.join('#gnugeneration', (input) => {
            console.log('joined');
            //client.say('#gnugeneration', 'Bonjour!');
        })
    });

    client.addListener('message#gnugeneration', Meteor.bindEnvironment((from, text) => {
        console.log(text);
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
 
    //--------------MPD-----------------
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

    //--------------TL------------------
    Meteor.publish('timeTables', () => {
        return TimeTables.find();
    });
    
    var renens = 3377704015495520;
    var flon = 3377704015495518;
    var m1 = 11821953316814882;

    var renensUrl = "http://syn.t-l.ch/apps/LineStopDeparturesList?roid=" + renens + "&lineid=" + m1 + "&date=";
    var flonUrl = "http://syn.t-l.ch/apps/LineStopDeparturesList?roid=" + flon + "&lineid=" + m1 + "&date=";

    var getTime = function(destination, json) {
        var journey = JSON.parse(json).journeys.journey || [];

        for (var i = 0; i < journey.length; i++) {
            var time;
            if (i < 2) {
                time = moment(journey[i].waiting_time, 'HH:mm:ss').format('m') + "'";
                if (time === "0'") {
                    time = '🚉';
                }
            } else {
                time = moment(journey[i].planned_time).format('HH:mm');
            }

            TimeTables.upsert({destination: destination, id: i}, {destination: destination, time: time, id: i});
        }

        TimeTables.remove({destination: destination, id: {$gt: journey.length - 1}});   
    }

    Meteor.setInterval(() => {
        var now = moment(new Date()).format('YYYY-MM-DD HH:mm');

        HTTP.get(renensUrl + now, (error, result) => {
            if (!error) {
                getTime('renens', result.content);
            }
        });
        
        HTTP.get(flonUrl + now, (error, result) => {
            if (!error) {
                getTime('flon', result.content);
            }
        });
    }, 20000);
}
