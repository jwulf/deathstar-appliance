
/////////////////////////////////////////////////////
// Utilities - utilities.js
//
// Used to provide utilities that are specific to the
// UX Modeling Framework.
//
// Author: Bo Lora
//
/////////////////////////////////////////////////////
console.log("initiating utilities")

/////////////////////////////////////////////////////
// URL Parsing Functions                           //
/////////////////////////////////////////////////////


function QueryStringToJSON(href) {
  qStr = href.replace(/(.*?\?)/, '');
  qArr = qStr.split('&');
  stack = {};
  for (var i in qArr) {
      if(qArr[i].indexOf("#")>-1) {
        //need to strip out potential anchor tag
        qArr[i] = qArr[i].split('#')[0];
      } 
      var a = qArr[i].split('=');
      var name = a[0],
          value = isNaN(a[1]) ? a[1] : parseFloat(a[1]);
      if (name.match(/(.*?)\[(.*?)]/)) {
          name = RegExp.$1;
          name2 = RegExp.$2;
          //alert(RegExp.$2)
          if (name2) {
              if (!(name in stack)) {
                  stack[name] = {};
              }
              stack[name][name2] = value;
          } else {
              if (!(name in stack)) {
                  stack[name] = [];
              }
              stack[name].push(value);
          }
      } else {
          stack[name] = value;
      } 
  } 
  return stack;
}

function humanDate() {
    var date = new Date();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];  
    var months = ["January", "February", "March", "April", "May",   
        "June", "July", "August", "September", "October", "November", "December"];  
    var pad = function(str) { str = String(str); return (str.length < 2) ? "0" + str : str; }  
  
    var meridian = (parseInt(date.getHours() / 12) == 1) ? 'PM' : 'AM';  
    var hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();  
    return days[date.getDay()] + ' ' + months[date.getMonth()] + ' ' + date.getDate() + ' '   
        + date.getFullYear() + ' ' + hours + ':' + pad(date.getMinutes()) + ':'   
        + pad(date.getSeconds()) + ' ' + meridian;  
}  

function URLPathToTemplateID(url_path) {
    if ( url_path === '/' ) return 'index.html';
    if ( url_path.substring(0,1) == '/') return url_path.substring(1, url_path.length);
    return url_path;
}

function getValidURLinWorkflow(url) {
    
    var page_id = URLPathToTemplateID(url);
    var applicationState = Session.get('applicationState');
    
    // No application state
    if (_.isUndefined(applicationState)) return url;
    
    // No workflow defined for this application state
    if (_.isUndefined(workflows[applicationState])) return url;
    
    // This URL is in the workflow
    if (! _.isUndefined(workflows[applicationState][page_id])) return url;
    
    // Use the fallback URL for the workflow
    if (workflows[applicationState].fallback) 
        return workflows[applicationState].fallback;
    
    // When all else fails
    return 'index';
}


function checkURLInWorkflow() {

    // Now we work out the url the user is requesting, and check it against the workflow for the 
    // current application state
    var URL = location.href;
    var URL_PATHNAME = location.pathname;
    var parameters = QueryStringToJSON(URL);
    
    page_id = URLPathToTemplateID(URL_PATHNAME);
    applicationState = Session.get('applicationState');
    console.log("Checking to see if " + page_id + " is in workflow: " + !(_.isUndefined(workflows[applicationState][page_id])));
    


    if (_.isUndefined(workflows[applicationState][page_id])) {
        // Currently requested path does not exist in workflow

        // check for a workflow fallback url
        // The application state must be set, there has to be a workflow for this application state, 
        // and that application state must have a fallback for this to fire
        if (applicationState && workflows[applicationState] && workflows[applicationState].fallback) {
            page_id = workflows[applicationState].fallback;
            history.pushState(null, null, '/' + page_id);
        }
        else
        // otherwise we default to root
        {
            if (page_id != 'index') browser.history.push(null,null, '/index.html');
            page_id = 'index';
        }
    }
    else {
        // valid page

        //need to see if a page template exists
        if (_.isUndefined(Template[page_id])) 
            var message_404 = 'Path is valid but page template is missing (&lt;template name="' + page_id + '.html"&gt;).';
    }
    
    return true;
}

function doInitialization(){
    Session.set('initializationState', 'initializing');
    Session.set('initializationMessage', 'Performing Initialization...');

    Meteor.call('initialize', Session.get('initializationURL'), 
        function initializationCallback(err, result){
        Session.set('initializationState', 'complete');
        if (result.error) {
            // false means success, 2 means already configured
            state = 'error';
            if ( result.error == 2 ) state = 'already_configured';
            Session.set('initializationState', state);
        }
        if (result.msg)
            Session.set('initializationMessage', result.msg);
        if (result.result)
            Session.set('initializationResult', result.result);
        });
   
}
