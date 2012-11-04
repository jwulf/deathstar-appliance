
var myAppRouter = Backbone.Router.extend({
    routes: {
        'initialize?from=*from' : 'initialize',
        'initializing' : 'initializing',
        '*path': 'main'
    },
    main: function (path) {
        var newpath;
        console.log('Routing ' + path);
        if ( path == '/' ) path = 'index';
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
    }
});


Router = new myAppRouter;

Backbone.history.start({pushState: true});

