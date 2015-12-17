Meteor.setInterval(() => {
    Session.set('clock', moment(new Date()).format('ddd D MMM • HH:mm:ss'));
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
