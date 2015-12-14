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
