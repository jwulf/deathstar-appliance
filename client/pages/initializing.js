Template.initializing.initializing = function () {
    return Session.get('initialization');
}

Template.initializing.message_class = function () {
    var status = Session.get('initializationState');
    if ( status === 'initializing' ) return 'alert-info';
    if ( status === 'error' ) return 'alert-error';
    if ( status === 'complete' ) return 'alert-success';
    if ( status === 'already_configured' ) return 'alert-success';
}

Template.initializing.status_title = function () {
    var status = Session.get('initializationState');
    if ( status === 'initializing' ) return 'Initialization in progress...';
    if ( status === 'error' ) return 'Oh no. Something went wrong!';
    if ( status === 'complete' ) return 'Initialization Completed';   
    if ( status === 'already_configured' ) return 'Machine Already Configured';
}

Template.initializing.message = function () {
    var msg = Session.get('initializationMessage');
    if ( msg ) return msg;
    return 'Requesting Initialization';
}

Template.initializing.configuration = function () {
    return Config.find({}).fetch();
}

Handlebars.registerHelper('initializing_success',  function () {
    var status = Session.get('initializationState');
    return ( ( status === 'complete') || 
        ( status === 'already_configured' ) );
});

Handlebars.registerHelper('initializing_error',  function () {
    return ( Session.get('initializationState' ) === 'error' );    
});

Handlebars.registerHelper('got_initialization_details', function () {
    var initDetails = Session.get('initializationResult');
    return (!_.isUndefined(initDetails));
});

Handlebars.registerHelper('iterateInitDetails', function () {
    output = '';
    var initDetails = Session.get('initializationResult');
    for (i in initDetails)
        if (i != 'originalJSON')
            output += '<p>' + initDetails[i] +'</p>';
    return output;
        
});

Handlebars.registerHelper('iterateConfig', function() {
    var output = '';
    var configuration = Config.find({}).fetch();
    for (var i=0; i<configuration.length; i++) {
        for (j in configuration[i]) {
            if ((j !== '_id') && (j !== 'domain'))
                output += '<p>' + j + ' : ' + configuration[i][j] + '</p>';
        }
    }
    return output;
});