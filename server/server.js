exec = __meteor_bootstrap__.require('child_process').exec;
spawn = __meteor_bootstrap__.require('child_process').spawn;

Meteor.startup(function () {
    Config = new Meteor.Collection("Configuration");

// appliance configuration is system-level files and database fields containing
// URLS and other site-specific configuration data
    var applianceConfig = Config.find({configurationDomain: 'appliance'});
   
// On initial startup there is no appliance configuration in the database   
   if (applianceConfig.count() == 0) {

    // Get the configuration object, then parse it
    
    // TODO: 
    // 1. See if we can pass a configuration object directly via REST from the installation script
    // to avoid having this url in the code
    // 2. Put a sane default URL in here for a public use case
        console.log('Performing initial system configuration');
        DEFAULT_CONFIG_URL = 'http://deathstar1.usersys.redhat.com/deathstar-setup.json';
        Meteor.call('updateFromURL', DEFAULT_CONFIG_URL);          
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
                "field": "someDBfield",
                "value": "somevalue"
            },
            human_readable_task_name_3:
            {
                "action": "install",
                "package": "http://someurl/somepkg.rpm"
            }
        }
        
        At a minimum the Death Star needs a productionURL and playtimeURL in order
        to resolve the PressGang servers that it will use
        */
        
        var cmd, configItem;
        for (item in configurationObject){
            configItem = configurationObject[item];
            //  COPY Command
            //
            // Download a static file to the filesystem
            //
            
            if (configItem.action && configItem.action == 'copy') {
                
                cmd = 'curl ' + config.src + ' --output ' + config.dest;
                console.log('Executing: ' + cmd);
                exec(cmd, 
                    function (error, stdout, stderr) {
                        if (error !== null)
                            console.log('exec error: ' + error);
                });
            }
            
            else
            
            // DATA Command
            // Sets a field in the configuration database
            //
            
            if (configItem.action && configItem.action == 'data'){
             
                var isNew = false;
                record = Config.find({domain: configItem.domain});
                if (record.count() == 0)
                    isNew = true;
                
                
                configurationRecord[configItem.field] = 
                    configurationRecord[configItem.value];
                    
            }
            
            else
            
            if (configItem.action && configItem.action == 'install'){
             
                cmd = 'yum install ' + configItem.pkg;
                console.log('Executing: ' + cmd);
                exec(cmd, 
                    function (error, stdout, stderr) {
                        if (error !== null)
                            console.log('exec error: ' + error);
                });
            }
        
        }
    
        return; 
    }
});





