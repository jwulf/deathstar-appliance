/////////////////////////////////////////////////////
// Global Handlers - global_handlers.js
//
// Used to provide handlebars with specialized 
// functions that provide decision points of handling
// of specific data as custom tags to render content.
//
// Author: Bo Lora
//
/////////////////////////////////////////////////////
console.log("initiating global handlers")




//Enables conditionals based on style such as "production", "apt", "magnum", etc
Handlebars.registerHelper('style', function(query) {
    if(query) {
		return site_prefs.style === query;
	}
	else {
		return site_prefs.style
	}
});

//Enables conditionals based on page id
//allows conditionals that are specific to a particular page
Handlebars.registerHelper('pageId', function(target_page_id) {
	if(target_page_id) {
		return target_page_id === page_id;
	}
	else {
		return page_id;
	}
});

//Evaluates a simple site preference for conditional display of modules
Handlebars.registerHelper('sitePrefs', function(config_key) {
	return site_prefs[config_key];
});

//Evaluates a simple site preference for conditional display of modules
Handlebars.registerHelper('sitePrefsByPage', function(config_key) {
	//returns true is page id is included in configuration
	return _.indexOf(site_prefs[config_key], page_id)>=0;
});


//Enables conditionals based on page id
//allows conditionals that are specific to a particular page
Handlebars.registerHelper('isValidPage', function() {
	if(page_id) {
		return target_page_id === page_id;
	}
	else {
		return page_id;
	}
});



// Link custom tag that renders a link html from a link object in the content object
Handlebars.registerHelper('link', function(link_object, options) {
	if(!_.isObject(link_object)) {
		link_object = content[link_object];
	}
	var attrs = [];

	  for(var prop in options.hash) {
	    attrs.push(prop + '="' + options.hash[prop] + '"');
	  }

	var result = '<a href="' + link_object.url + '"'+ attrs.join(" ") +'>' + link_object.text + '</a>';
  	return result;
});

// Editable is used by the msg handler to tag content elements with "editable" class
// according to a site wide configuration to allow on page editing of content (for future use)
Handlebars.registerHelper('editable', function() {
	if (site_prefs.editableContent) {
		var editableClass = 'class="editable"';
	} else {
		var editableClass = "";
	}
	return editableClass;
});


// Button custom tag that renders a link html from a link object in the content object
Handlebars.registerHelper('button', function(textkey, className) {
	var msg = getMsg(textkey, "")
	var url = eval("content."+textkey+"_url");
    var js = eval("content."+textkey+"_js");
    if (!js) {
    	if(!url){url = textkey}
    	var result = '<a href="' + url + '" class="'+className+' deathstar-navlink"->' + msg + '</a>';
    } else {
        var result = '<a href="javascript:void(0);" onclick="' + js + '" class="'+className+' deathstar-navlink"->' + msg + '</a>';
    }
  	return result;
});


Handlebars.registerHelper('isAppConfigured', function() {
    return !(Session.get('applicationState') == 'unconfigured');
});

Handlebars.registerHelper('getApplicationState', function() {
    return Session.get('applicationState');    
});



// Handler for linked msg using content object
// TODO this needs some work.. need to test
Handlebars.registerHelper('linked_msg', function(textkey, options) {
	var msg = getMsg(textkey, options);
	console.log(msg)
	//find urls
	var url_index = 0;
	var urls = []
	while(eval("content."+textkey+"_url_"+url_index)) {
		urls[url_index] = eval("content."+textkey+"_url_"+url_index);
		url_index++;
	}
	if(urls){

		var regex = /\[(.*?)\]/;
		var i = 0;
		console.log("regex "+msg.match(regex))
		var link_text_array = [];
		link_text_array = msg.match(regex);
		if(!link_text_array) { 
			link_text_array = msg
		}

			while(urls[i]) {
				var pattern = link_text_array[0];
				var link_text = link_text_array[1];

  			console.log(link_text)

				var link = '<a href="'+urls[i]+'">'+link_text+'</a>';
				var msg = msg.replace(pattern,link);
				i++;
				console.log(html)
			}
			var html = msg;
		}
		else {
			var html = msg;
		}
  	return html;
});

// function for linked_msg and msg handlers
function getMsg(textkey, options){

	var isMarkdown = false;
	var target_textkey = eval("content."+textkey);
	if (!target_textkey) {
		target_textkey = eval("content."+textkey+"_markdown");
		if (target_textkey) {
			msg = target_textkey;
			var isMarkdown = true;
		}
		else {
			return "{"+textkey+"}"
		}
	} 
	else {
		//console.log("checking "+textkey)
		msg = target_textkey;				
	}


	var attrs = [];
	var hasClass = false;
	if (site_prefs.editableContent) {
		var editable = true;
	} else {
		var editable = false;
	}
	for(var prop in options.hash) {
	  	if(prop == "class" && editable) {
	  		options.hash[prop] = options.hash[prop] + " editable";
	  		hasClass = true;
	  	}
	  	if(prop == "data"){
	  		var val = options.hash[prop];
	  		if (typeof val == "string" && val.substring(0, 3) == "fn=") {
	  			var val = val.substring(3, val.length).split(".");
	  			var module = val[0];
	  			var dataref = val[1];
	  			var data = Template[module][dataref]();
	  		}
	  		var val = options.hash[prop];
	  		if (typeof val == "string" && val.substring(0, 3) == "cf=") {
	  			var key = val.substring(3, val.length);
	  			var data = config_options[key];
	  		}

	  		
	  		var regex = /\{[0-9]\}*/;
	  		if(_.isArray(data)) {
	  			var i = 0;
	  			while(msg.match(regex)) {
	  				msg = msg.replace(msg.match(regex),data[i]);
	  				i++;
	  			}
	  		} 
	  		else {
	  			msg = msg.replace(msg.match(regex),data);
	  		}
	  		
	  	}
	  	else {
	  		attrs.push(prop + '="' + options.hash[prop] + '"');
	  	}
	    
	}
	if(!hasClass && editable) {
		attrs.push('class="editable"')	
	}
	if (editable) {
		if(isMarkdown){attrs.push('data-type="markdown"')}
		var html = '<span class="editable"'+ attrs.join(" ") +'>' +msg+'</span>';
	}
	else {
		var html = msg;
	}
  return html;
}

// Returns externalized content
Handlebars.registerHelper('msg', function(textkey, options) {
	return getMsg(textkey, options);
});


//to display images that are local based
//usage {{{imgByLocale "/images/whatever.jpg" class="whatever"}}}
Handlebars.registerHelper('imgByLocale', function(path, options) {
	var attrs = [];
	for(var prop in options.hash) {
	  		attrs.push(prop + '="' + options.hash[prop] + '"');    
	}	
	var pathArray = path.split(".");
	if(site_prefs.locale == "en_US") {
		var url = location.origin+path;
	}
	else {
		var url = location.origin+pathArray[0]+"."+site_prefs.locale+"."+pathArray[1];
	}
  	return "<img src='"+url+"' "+attrs.join(" ")+"/>";
  	
});

Handlebars.registerHelper('img', function(path, options) {
	var attrs = [];
	for(var prop in options.hash) {
	  		attrs.push(prop + '="' + options.hash[prop] + '"');    
	}
	var url = location.origin+path;

  	return "<img src='"+url+"' "+attrs.join(" ")+"/>";
  	
});

