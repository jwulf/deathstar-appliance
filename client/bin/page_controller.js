
/////////////////////////////////////////////////////
// Page Controller - page_controller.js
//
// This is the main client page controller that puts 
// together the UI for the client. 
//
// This program is responsible for reading all configurations 
// and determining what pages to present to the client
//
// Author: Bo Lora
//
/////////////////////////////////////////////////////
console.log("initiating main page controller")


Template.page_controller.display_page = function () {
    var page = Session.get('page_id');
    if (Template[page]){
        console.log("Loading page template for " + page);
        return Template[page]()
    }
    else
    {
        console.log("Page template for " + page + ' not found');
        return Template['page_404']();
    }
};

Template.page_controller.isConfigured = function () {
    return Session.get('isConfigured');
}

Template.page_controller.welcome = function () {
    return Template['welcome']();   
}

Template.page_controller.events = {
  'click .deathstar-navlink': function (event) {
        // prevent default browser link click behaviour
        event.preventDefault();
        
        // get the path from the link      
        var link = event.currentTarget.href;
    	var reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
    	extracted = reg.exec(link);

        // this blows up if given
        // <a href="/"></a> - so, workaround:

        if (extracted)
        {
            pathname = reg.exec(link)[1];
        } else {
            pathname = 'index';
        }
        
        Router.navigate(pathname, true);
    	// set the session variable
//    	Session.set('page_id', pathname.substring(1, pathname.length));
  }
};
// populate the zones


Meteor.startup(function () {
/*	if(css_overide){
		var css_overide_link = '<link rel="stylesheet" href="'+css_overide+'">';
		$('head').append(css_overide_link);
	}
	$('body').attr('id', page_id);
*/
});





