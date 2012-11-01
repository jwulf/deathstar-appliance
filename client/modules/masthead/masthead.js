Template.module_masthead.nav = function() {
	
	var masthead_obj = [];
	_.each(site_prefs.nav, function(nav_item){
		var temp_obj = {};
		temp_obj.id = nav_item;
		temp_obj.text_key = "text_nav_"+nav_item;
		masthead_obj.push(temp_obj)
	});
	return masthead_obj;
}
Template.module_masthead.configurator = function() {
	var configurators_obj = [];
	_.each(site_prefs.configurators, function(configurator_id, index){
		var temp_obj = {}
		temp_obj.configurator_id = configurator_id;
		temp_obj.text_key = "text_masthead_config_menu_"+configurator_id;
		temp_obj.notLast = !(index+1 === site_prefs.configurators.length);
		configurators_obj.push(temp_obj);
	})
	return configurators_obj;
}

Template.module_masthead.productionStateIndicator = function() {
    productionState = Session.get('productionState');
    if (productionState === 'production') return 'error-text';
    if (productionState === 'playing') return 'success-text';
    return '';
}