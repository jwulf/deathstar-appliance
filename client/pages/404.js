if (Meteor.is_client) {



	Template.page_404.error_message = function () {
				
		if(parameters.msg){
			var msg =  parameters.msg;
		}
		else {
			if(message_404){
				var msg =  message_404;
			}
			else {
				var msg = "Page not found";
			}	
		}
		return msg;
	}


}