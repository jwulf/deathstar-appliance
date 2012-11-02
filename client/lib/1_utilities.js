
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

function URLPathToTemplateID(url_path) {
    if ( url_path === '/' ) return 'index.html';
    return url_path.replace(/\//, '');
}

function checkURLInWorkflow() {

    // Now we work out the url the user is requesting, and check it against the workflow for the 
    // current application state
    var URL = location.href;
    var URL_PATHNAME = location.pathname;
    var parameters = QueryStringToJSON(URL);
    
    page_id = URLPathToTemplateID(URL_PATHNAME);
    applicationState = Session.get('applicationState');
    console.log("Checking to see if " + URL_PATHNAME + " is in workflow: " + !(_.isUndefined(workflows[applicationState][page_id])));

    // Currently requested path does not exist in workflow
    if (_.isUndefined(workflows[applicationState][page_id])) {
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

