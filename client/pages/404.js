if (Meteor.is_client) {



	Template.page_404.error_message = function () {
				
		return 'Page not found';
	}


}