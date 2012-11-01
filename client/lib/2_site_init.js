/////////////////////////////////////////////////////
// Site Initiator - site_init.js
// Sets up all site and page configurations
// Author: Bo Lora
/////////////////////////////////////////////////////

console.log("initiating site init")

var DEFAULT_PAGE_ID = "index";

var RANDOM_ID = Math.floor(Math.random() * 12345789);
//implemented random id because I noticed that chrome
//was caching the configs.. will have to look into this later

var SITE_PREFS_PATH = "/config/site_prefs.json?" + RANDOM_ID;
var CONTENT_PATH = "/config/messages";
var URL_MAP_PATH = "/config/urlMapping.json?" + RANDOM_ID;
var WORKFLOWS_PATH = "/config/workflows.json";
var SITE_PATH = "/config/";

// get site preferences
console.log("looking for " + SITE_PREFS_PATH)
var site_prefs;
$.ajax({
    url: SITE_PREFS_PATH,
    dataType: 'json',
    async: !1,
    success: function(data) {
        site_prefs = data;
    }
});

console.log("site preferences", site_prefs);

if (site_prefs) {

    // get interface message strings
    var content;
    CONTENT_PATH = CONTENT_PATH + ".json";
    console.log("looking for " + CONTENT_PATH)

    $.ajax({
        url: CONTENT_PATH,
        dataType: 'json',
        async: !1,
        success: function(data) {
            content = data;
        }
    });

    console.log("content ", content)

    console.log("looking for " + WORKFLOWS_PATH);
    
    var workflows;
    $.ajax({
        url: WORKFLOWS_PATH,
        dataType: 'json',
        async: !1,
        success: function(data) {
            workflows = data;
        }
    });
    
    console.log("workflows " , workflows);
    
    APPLICATION_WORKFLOW_STATES = [];
    for (var i in workflows) APPLICATION_WORKFLOW_STATES.push(i);
    
    var page_id;
    var css_override;
    
    checkURLInWorkflow();
}

console.log("page id is: " + page_id);