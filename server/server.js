exec = __meteor_bootstrap__.require('child_process').exec;
spawn = __meteor_bootstrap__.require('child_process').spawn;

INSTALL_DIR = '/opt/deathstar-appliance';
CONFIG_URL = '/config/configurationURL.json';

Meteor.startup(function () {

    Config = new Meteor.Collection("Configuration");
    InstalledUpdates = new Meteor.Collection("InstalledUpdates");
    AvailableUpdates = new Meteor.Collection("AvailableUpdates");
    
    // If this machine has not been initialized
    // immediately pull a git update to patch it to the latest stable version
    
    // means we can distribute the VM with the code at any rev
    // and rely on it starting with the latest version 
    if (Config.find({}).count() === 0)
        pullUpdate();

});   

function updateFromURL(url) {
    // Stub function
    return Meteor.call('updateFromURL', url);
}

function processConfigurationObject( resultJSON, req_dryrun) {
    // Stub function
    return Meteor.call('processConfigurationObject', resultJSON, req_dryrun);
}

function pullUpdate(){
    Meteor.call('pullUpdate');   
}

Meteor.methods({
    
    // Allow initial configuration via remote method call
    initialize: function(url){
        
        // First, we check for existing configuration information
        // This is a one-time operation        
        if (Config.find({}).count() !== 0) return ({error: 2, msg: 'This machine has already been initialized. Initialization is a one-time operation. For further configuration use manual configuration or remote updates.'});
        
        var result = updateFromURL(url);
        if (!result.error)  
            Config.insert({initialized: 'remotely', date: humanDate(), remoteInitializationURL : url});
        
        return result;
            
    },
    
    // Method exposed to allow rapid prototyping and troubleshooting in the field
    // Should be protected in a production model
    updateFromURL: function(url, req_dryrun){
        var result, resultJSON;
        console.log( 'Requested update from ' + url );
        
        // Called with no URL
        if (!url) return ({error: true, msg: 'No URL passed for update'});
        
        var result = Meteor.http.get(url);
        if (result.statusCode === 200)
        {
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
                        return({error: true, msg: 'I couldn\'t understand the configuration instructions retrieved from ' + url});
                   }
            }
            if (resultJSON) {
                var status = Meteor.call('processConfigurationObject',resultJSON, req_dryrun);
                return(status);
            }
            return({error: 'error', msg: 'No update information found at ' + url});
        }
        return({error: 'error', msg: 'I encountered an error while attempting to retrieve configuration instructions from: ' + url});
    },
    
    processConfigurationObject: function (configurationObject, req_dryrun){
      
        const CMD_INSTALL_PACKAGE = 'install package';;
        const CMD_COPY_FILE = 'copy file';
        const CMD_PULL_UPDATE = 'pull update';
        const CMD_DATA = 'data';
        
        var result = {};
        result.originalJSON = configurationObject;
        result.date = humanDate();
        
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
                    "domain" : [system | csprocessor | appliance],
                    "operation" : [set | unset ],
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
                    return({error: 1, msg: 'Update has already been applied'});
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
                        if (dryrun) result['task_' + numerator] = '"'+ item + '" :' +
                            '\nCopy ' + task.src + ' to ' + task.dest + '\n';
                            
                        if (!dryrun) Meteor.call('copyFile', task.src, task.dest);       
                        
                        numerator ++;
                    }
                }
                
                //
                // data
                // Sets a field in the configuration database
                //
                
                if (task.action && task.action == CMD_DATA){
                    if (task.key && task.value && task.operation) {
                        
                        if (dryrun) result['task_' + numerator] = '"' + item + '" :' + 
                            '\n' + task.operation +'  ' + task.domain + 
                            '/' + task.key + ' to ' + task.value + '\n';
                        numerator ++;
                        if (!dryrun) {
                            var isNew = false;
                            var updateObject = {};
                            
                            if ( task.operation == "set" ) {
                                    
                                console.log('find({ domain: ' + task.domain+'})');
                                record = Config.find({domain: task.domain}).fetch();
                                if (record.length === 0) {
                                    // initializing this domain
                                    console.log('Initializing domain: ' + task.domain);
                                    updateObject.domain = task.domain;
                                    updateObject[task.key] = task.value;
                                    console.log(updateObject);
                                    console.log('Config.insert(');
                                    console.log(updateObject);
                                    Config.insert(updateObject);
                                } else {
                                    // updating this domain
                                    console.log('Updating domain: ' + task.domain);
                                    updateField = {};
                                    updateField[task.key] = task.value;
                                    updateObject = { $set: updateField };
                                    console.log('Config.update({domain : ' + task.domain+'},');
                                    console.log(updateObject);
                                    Config.update({domain: task.domain}, updateObject);
                                }
                            }
                            
                            // Check this out, because I think this will delete the
                            // whole document
                            if ( task.operation == 'unset' ) {
                                updateObject.domain = task.domain;
                                updateObject[task.key] = task.value;
                                record = Config.remove(updateObject);   
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
                        if (dryrun) result['task_' + numerator] = '"' + item + '" :' + 
                            '\nInstall Package ' + task.pkg + '\n';
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
                    if (dryrun) result['task_' + numerator] = '\nPull Git update\n';
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
            InstalledUpdates.insert(result);
            return ({error: false, result: result, msg: 'Update applied'}); 
        } else {
            return ({error: false, result: result, msg: 'Dry run completed'});
        }
    },
    
    // Method exposed to allow rapid prototyping and troubleshooting in the field
    // Should be protected in a production model
    pullUpdate: function () {
        console.log('Executing git pull to update server code');
        exec('git pull', {cwd: INSTALL_DIR},
            function (error, stdout, stderr) {
                    console.log(stdout);
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

function humanDate() {
    var date = new Date();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];  
    var months = ["January", "February", "March", "April", "May",   
        "June", "July", "August", "September", "October", "November", "December"];  
    var pad = function(str) { str = String(str); return (str.length < 2) ? "0" + str : str; }  
  
    var meridian = (parseInt(date.getHours() / 12) == 1) ? 'PM' : 'AM';  
    var hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();  
    return days[date.getDay()] + ' ' + months[date.getMonth()] + ' ' + date.getDate() + ' '   
        + date.getFullYear() + ' ' + hours + ':' + pad(date.getMinutes()) + ':'   
        + pad(date.getSeconds()) + ' ' + meridian;  
}  





