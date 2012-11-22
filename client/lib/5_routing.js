
var myAppRouter = Backbone.Router.extend({
    routes: {
        'initialize?from=*fromURL' : 'initialize',
        'initializing' : 'initializing',
        'editor/:topicid/*serverURL' : 'editor',
        'edit/:serverid/:topicid' : 'edit',
        '*path': 'main'
    },
    main: function (path) {
        var newpath;
        console.log('Routing ' + path);
        if ( path == '/' || path == '' ) path = 'index';
        newpath = getValidURLinWorkflow(path);
        Session.set('page_id', newpath);
    },
    initializing: function (path) {
        var status = Session.get( 'initializationState' );
        if (typeof status !== 'undefined' ) 
        {
            Session.set('page_id', 'initializing');
        } else {
            Router.navigate('/', true);
        }
    },
        
    initialize: function (fromURL) {
        var state;
        console.log('Got a request to initialize from ' + fromURL); 
        if (fromURL) {
            Session.set('initializationURL', fromURL);
            doInitialization();      
            Router.navigate('initializing', true);
        }
    },
    
    // This endpoint allows us to invoke the editor with an arbitrary server
    editor: function (topicid, serverurl){
        
    },
    
    edit: function (serverid, topicid) {
        Session.set('editorServer', serverid);
        if ( topicid )    
            Session.set('editorTopicID', topicid);
        if ( serverid && topicid) {   
            Router.navigate('edit', true);
        }
    }
});


Router = new myAppRouter;

Backbone.history.start({pushState: true});

