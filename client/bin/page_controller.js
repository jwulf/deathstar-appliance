
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
    console.log("Loading page template for " + page_id)
    return Template[page_id]();
};

Template.page_controller.isConfigured = function () {
    return Session.get('isConfigured');
}

Template.page_controller.welcome = function () {
    return Template['welcome']();   
}

/*
Template.page_controller.events = {
  'click input.inc': function () {
    Players.update(Session.get("selected_player"), {$inc: {score: 5}});
  }
};
*/

// populate the zones


Meteor.startup(function () {
/*	if(css_overide){
		var css_overide_link = '<link rel="stylesheet" href="'+css_overide+'">';
		$('head').append(css_overide_link);
	}
	$('body').attr('id', page_id);
*/
});





