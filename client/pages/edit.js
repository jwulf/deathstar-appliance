Template.edit.rendered = function () {
//  create CodeMirror if it doesn't exist
//  REST load the topic from PressGang

    if ( !editor  ) {
        // We set this to 0 here, this will trigger the keypress event to set it
        Session.set('editorHTMLPreviewTimerID', 0);
        
        editor = CodeMirror(function(elt) {
            elem = document.getElementById("code");
            elem.parentNode.replaceChild(elt, elem);
            } , {
            	mode: 'text/html',
    		extraKeys: {
    		//	"'>'": function(cm) { cm.closeTag(cm, '>'); },
    	  //		"'/'": function(cm) { cm.closeTag(cm, '/'); }
      		},	   			
    		onChange: function(cm, e) {
          //enableSaveRevert();
    		//	makeValidityAmbiguous();
    			},
    		onKeyEvent: function(cm, e) {
                // if no timer is running, start one with a 500ms interval to update
                // the preview
    			  if (Session.get('editorHTMLPreviewTimerID') == 0)  {
                    var timerID = Meteor.setTimeout(function(){
                             Meteor.call('htmlPreview', editor.getValue(), function (err,result) {
                                 if (result !== '<p>Could not transform</p>')
                                $('.div-preview').html(result);
                                Session.set('editorHTMLPreviewTimerID', 0);
                            })
                    ;}, 500);
                    Session.set('editorHTMLPreviewTimerID', timerID);    
    			  }
              		 

                    k=e.keyCode;
            		if (k != 16 && k != 17 && k != 18 && k != 20 && k != 19 && k != 27 && k != 36 && k != 37 && k != 38 && k != 39 && k !=40 && k != 45)
            		{
              //			enableSaveRevert();
              //			makeValidityAmbiguous();
            		}
            		return false; // return false tells Codemirror to also process the key;
    		}, 
    	  	wordWrap: true,
    	  	lineWrapping: true,
    	  //	height: myHeight,
            width: 520,
    	  	disableSpellcheck: false,
            lineNumbers: true
    	});

        
        getTopic();
    }    
}

Template.edit.created = function () {
    editor = null;   
}

Template.edit.topicID = function () {
    return Session.get('editorTopicID');   
}

Template.edit.events({
   'click #save-button': function(event){
        updateParent(Session.get('editorTopicID'), $('.div-preview').html());
   }
});

function updateParent(topicid, newContent) {
        window.opener.updateTopic(topicid, newContent);
}


function getTopic (){
    Meteor.subscribe('ConfigurationSubscription', function(){
        var server = Session.get('editorServer');
        var configuration = Config.findOne({domain: 'system'});
        serverURL = server;
        if ( server == 'test' ) serverURL = configuration.testServer;
        if ( server == 'production' ) serverURL = configuration.productionServer;
        var topicID = Session.get('editorTopicID');
        pg = new PressGangCCMS.PressGangCCMS(serverURL);
        if (serverURL) 
        pg.getTopicData('xml', topicID, 
            function(err, result){
                editor.setValue(result);
                Meteor.call('htmlPreview', result, function (err,result) {
                    $('.div-preview').html(result);
                });
            });
    });
}

