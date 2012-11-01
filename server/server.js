exec = __meteor_bootstrap__.require('util').exec;
spawn = __meteor_bootstrap__.require('util').spawn;

Meteor.startup(function () {
    Config = new Meteor.Collection("Config");
});




