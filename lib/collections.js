Messages = new Mongo.Collection('messages');
TimeTables = new Mongo.Collection('timeTables');
Songs = new Mongo.Collection('songs');

if (Meteor.isServer()) {
	Songs._createCappedCollection(10000, 20);
}
