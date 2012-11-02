 Config = new Meteor.Collection("Configuration");
 
// Application workflow states are different states that the app can be in
// In each state different urls are valid, thus enabling workflow control


// This indicates whether we are operating against the test server (play), 
// or the production server (production).
OPERATING_IN = ['production', 'play'];


// Check for the configuration data
// If it doesn't exist, we haven't been configured yet, and we'll
// set Session.isConfigured to false
// This will trigger the welcome wizard
var configuration = Config.find({}).fetch();

Session.set('applicationState', (configuration == true ? 'configured' : 'unconfigured'));

// Get the system config. This lets us know what state we're in - production or 
// playing
var systemConfig = Config.find({domain: 'system'}).fetch();
if (systemConfig) {
    Session.set('productionState',  systemConfig.productionState);
}
    
    

