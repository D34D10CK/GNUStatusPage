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
