exec = __meteor_bootstrap__.require('child_process').exec;
spawn = __meteor_bootstrap__.require('child_process').spawn;

INSTALL_DIR = '/opt/deathstar-appliance';
CONFIG_URL = '/config/configurationURL.json';

Meteor.startup(function () {

    Config = new Meteor.Collection("Configuration");
    Updates = new Meteor.Collection("Updates");

// appliance configuration is system-level files and database fields containing
// URLS and other site-specific configuration data
    var applianceConfig = Config.find({configurationDomain: 'appliance'});
   
// On initial startup there is no appliance configuration in the database   
   if (applianceConfig.count() == 0) {

    // Get the configuration object, then parse it
    
        console.log('Performing initial system configuration');
        DEFAULT_CONFIG_URL = 'http://deathstar1.usersys.redhat.com/deathstar-setup.json';
        configurationInformation = Meteor.http.get(CONFIG_URL);
        if (configurationInformation.statusCode === 200)
            if (configurationInformation.data.url)
                Meteor.call('updateFromURL', configurationInformation.data.url + '/initialize.json');          
    }
});

Meteor.methods({
    
    updateFromURL: function(url){
        var result = Meteor.http.get(url);
        if (result.statusCode === 200)
            if (result.data)
                Meteor.call('processConfigurationObject', result.data);
                
    },
    processConfigurationObject: function (configurationObject){
      
        console.log('Processing configuration commands:');
        console.log(configurationObject);
        
        /* The Configuration Object looks like this:
        {
            description: "Human readable description",
            
            uuid: UUID, // used to tell if it has been applied or not
            
            tasks: {
                
                human_readable_task_name_1:
                {
                    "action": "copy",
                    "src": "http://someurl/somefile",
                    "dest": "/local/file/path"
                },
                human_readable_task_name_2:
                {
                    "action": "data",
                    "domain" : [system, csprocessor, appliance]
                    "key": "someDBfield",
                    "value": "somevalue"
                },
                human_readable_task_name_3:
                {
                    "action": "install",
                    "package": "http://someurl/somepkg.rpm"
                }, 
                human_readable_task_name_4:
                {
                    "action": "pull_update"
                }
            }
        }
        
        At a minimum the Death Star needs a productionURL and playtimeURL in order
        to resolve the PressGang servers that it will use
        */
        
        // TODO: Parse each task to make sure that it has all the request pieces
        // A malformed update object could crash this process
        
        if (Updates.find({id: configurationObject.uuid}).count > 0 ){
            console.log("Update has already been applied");
            return('Update has already been applied');
        }
            
        var cmd, task;
        for (item in configurationObject.tasks){
            task= configurationObject.tasks[item];
            
            //  COPY Command
            //
            // Download a static file to the filesystem
            //
            
            if (task.action && task.action == 'copy') {
                if (task.src && task.dest){
                    
                }
            }
            
            // DATA Command
            // Sets a field in the configuration database
            //
            
            if (task.action && task.action == 'data'){
                if (task.key && task.value){
                    
                    var isNew = false;
                    var updateObject = {};
                    record = Config.find({domain: task.domain});
                    if (record.count() == 0) {
                        // initializing this domain
                        updateObject.domain = task.domain;
                        updateObject[task.key] = task.value;
                        Config.insert(updateObject);
                    } else {
                        // updating this domain
                        updateObject[task.key] = {" $set": "value" }
                        Config.update({'domain': task.domain}, updateObject);
                    }
                
                }                    
            }
              
            // INSTALL Command
            // yum installs a package over the network
            //
            
            if (task.action && task.action == 'install'){
                if (task.pkg) 
                    Meteor.call('installPackage',task.pkg);   
            }

            // PULL_UPDATE Command
            // uses git pull to update the server code
            //
            
            if (task.action && task.action == 'pull_update'){
                Meteor.call('pullUpdate');
            }
            
            
        }
    
        // We have an issue here: if an async exec process fails
        // we are not notified, and the update is persisted as 
        // successful
        // TODO: Look at making it async using a Fiber
        
        Updates.insert(configurationObject);
        return ('Update applied'); 
    },
    
    // Method exposed to allow rapid prototyping and troubleshooting in the field
    // Should be protected in a production model
    pullUpdate: function () {
        console.log('Executing git pull to update server code');
        exec('git pull', {cwd: INSTALL_DIR},
            function (error, stdout, stderr) {
                    if (error !== null)
                        console.log('exec error: ' + error);
                 }
            );
        return('Pulling update');  
    },
    
    // Method exposed to allow rapid prototyping and troubleshooting in the field
    // Should be protected in a production model
    installPackage: function (pkgURL) {
        var cmd = 'yum install -y ' + pkgURL;
        console.log('Executing: ' + cmd);
        exec(cmd, 
            function (error, stdout, stderr) {
                if (error !== null)
                    console.log('exec error: ' + error);
             }
        );   
        return('Installing package');
    },
    
    // Method exposed to allow rapid prototyping and troubleshooting in the field
    // Should be protected in a production model
    installFile: function (src, dest) {
        cmd = 'curl ' + config.src + ' --output ' + config.dest;
        console.log('Executing: ' + cmd);
        exec(cmd, 
            function (error, stdout, stderr) {
                if (error !== null)
                    console.log('exec error: ' + error);
        });
    }
    
    
    
    
});





