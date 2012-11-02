exec = __meteor_bootstrap__.require('child_process').exec;
spawn = __meteor_bootstrap__.require('child_process').spawn;

INSTALL_DIR = '/opt/deathstar-appliance';
CONFIG_URL = '/config/configurationURL.json';

Meteor.startup(function () {

    Config = new Meteor.Collection("Configuration");
    InstalledUpdates = new Meteor.Collection("InstalledUpdates");
    AvailableUpdates = new Meteor.Collection("AvailableUpdates");

// appliance configuration is system-level files and database fields containing
// URLS and other site-specific configuration data

});   

Meteor.methods({
        
    // Method exposed to allow rapid prototyping and troubleshooting in the field
    // Should be protected in a production model
    updateFromURL: function(url, req_dryrun){
        var result, resultJSON;
        console.log( 'Fetching update from ' + url );
        var result = Meteor.http.get(url);
        if (result.statusCode === 200)
            console.log('Got a result');
            if ( result.data ) {
                console.log('Response is JSON-encoded data');
                resultJSON = result.data;
            } else {
                // Hack casting string to JSON object
                // allows to serve configuration object from svn over http
                if ( result.content && typeof result.content === String )
                    // strip line breaks and parse as JSON
                    console.log('Response is string-encoded data');
                    var strippedString = result.content.replace(/(\r\n|\n|\r)/gm,"");
                   // console.log(strippedString);
                   try { 
                        resultJSON = JSON.parse(strippedString);
                   }
                   catch (e)
                   {
                        console.log('Error parsing response object');
                        return('Error parsing response object');
                   }
            }
            if (resultJSON) {
                var status = Meteor.call('processConfigurationObject',resultJSON, req_dryrun);
                return(status);
            }
        return(result);
    },
    
    processConfigurationObject: function (configurationObject, req_dryrun){
      
        const CMD_INSTALL_PACKAGE = 'install package';;
        const CMD_COPY_FILE = 'copy file';
        const CMD_PULL_UPDATE = 'pull update';
        const CMD_DATA = 'data';
        
        console.log('Processing configuration commands:');
        //console.log(configurationObject);
        
        /* The Configuration Object looks like this:
        {
            description: "Human readable description",
            
            uuid: UUID, // used to tell if it has been applied or not
            
            "dry run only": true // optional: if true, will parse but not execute 
            
            tasks: {
                
                human_readable_task_name_1:
                {
                    "action": "copy file",
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
                    "action": "install package",
                    "package": "http://someurl/somepkg.rpm"
                }, 
                human_readable_task_name_4:
                {
                    "action": "pull update"
                }
            }
        }
        
        At a minimum the Death Star needs a productionURL and playtimeURL in order
        to resolve the PressGang servers that it will use
        */
        
        // We do at least a dry run to log the tasks to the console
        // and then a real thing, unless the object specifies dryrun: true
        var dryrun = true;
        var passes = 2;
        if (configurationObject['dry run only']) {
            passes = 1;
            console.log('Dry run only');
        }
        
        for (var i = 0; i < passes; i ++)
        {
            
            if (InstalledUpdates.find({uuid: configurationObject.uuid}).count > 0 ){
                console.log("This update has already been applied to this system");
                if (!dryrun)
                    return('Update has already been applied');
            }
              
            if (dryrun) console.log('Tasks:');
              
            var cmd, task, numerator = 1;
            for (item in configurationObject.tasks){
                task = configurationObject.tasks[item];
                
                //  
                // copyFile
                // Download a static file to the filesystem
                //
                
                if (task.action && task.action == CMD_COPY_FILE) {
                    if (task.src && task.dest) {
                        if (dryrun) console.log( '' + numerator + '. ' + item +
                            '\nCopy ' + task.src + ' to ' + task.dest + '\n');
                        if (!dryrun) Meteor.call('copyFile', task.src, task.dest);       
                        numerator ++;
                    }
                }
                
                //
                // data
                // Sets a field in the configuration database
                //
                
                if (task.action && task.action == CMD_DATA){
                    if (task.key && task.value) {
                        
                        if (dryrun) console.log('' + numerator + '. ' + item + 
                            '\nSet ' + task.domain + 
                            ':' + task.key + ' to ' + task.value + '\n');
                        numerator ++;
                        if (!dryrun) {
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
                }
                  
                //
                // installPackage 
                // yum installs a package over the network
                //
                
                if (task.action && task.action == CMD_INSTALL_PACKAGE){
                    if (task.pkg) {
                        if (dryrun) console.log('' + numerator + '. ' + item + 
                            '\nInstall Package: ' + task.pkg + '\n');
                        if (!dryrun)
                            Meteor.call('installPackage',task.pkg);   
                        numerator ++;
                    }
                }
    
                //
                // pullUpdate
                // uses git pull to update the server code
                //
                
                if (task.action && task.action == CMD_PULL_UPDATE){
                    if (dryrun) console.log('' + numerator + '. ' + '\nPull Git update\n');
                    if (!dryrun) Meteor.call('pullUpdate');
                    numerator ++;
                }
            }
            
            dryrun = false;
            
        }
        
        // We have an issue here: if an async exec process fails
        // we are not notified, and the update is persisted as 
        // successful
        // TODO: Look at making it async using a Fiber
        
        if ( !dryrun ) {
            InstalledUpdates.insert(configurationObject);
            return ('Update applied'); 
        }
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
    copyFile: function (src, dest) {
        cmd = 'curl ' + src + ' --insecure --output ' + dest;
        console.log('Executing: ' + cmd);
        exec(cmd, 
            function (error, stdout, stderr) {
                if (error !== null)
                    console.log('exec error: ' + error);
        });
    }
    
    
    
    
});





