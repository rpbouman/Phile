/*

Copyright 2014, 2015 Roland Bouman (roland.bouman@gmail.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/
/*
    This is phile4js - a stand-alone, cross-browser javascript library
    for working with Pentaho repository files.
    Phile, pronounced as "file" is an acronym for PentHO fILEs.
    Pentaho is a leading open source business intelligence platform.
    Pentaho has a repository for storing content.
    The repository is organized resembling a directory/file system.
    phile4js enables web applications to access files in the pentaho repository/

    This file contains human-readable javascript source along with the YUI Doc compatible annotations.
    Include this in your web-pages for debug and development purposes only.
    For production purposes, consider using the minified/obfuscated versions in the /js directory.
*/

(function(exports){

function escapePath(path){
  return path.replace(/\//g, ":");
}

function ensureFolder(file) {
  if (String(file.folder) !== "true") {
    throw new Error("File must be of the type folder");
  }
}

function ensureFile(file) {
  if (String(file.folder) === "true") {
    throw new Error("File must not be of the type folder");
  }
}

function ajax(options){
  var xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP.3.0"),
      args, url = options.url,
      name, value
  ;
  if (options.params) {
    for (name in options.params) {
      url += (url.indexOf("?") === -1 ? "?" : "&") +
              name + "=" + encodeURIComponent(options.params[name])
      ;
    }
  }
  var method = options.method || "GET";
  args = [method, url, options.async];
  if (options.username && options.password) {
      args.push(options.username, options.password);
  }
  xhr.open.apply(xhr, args);
  xhr.onreadystatechange = function(){
    var scope = options.scope || null;
    switch (this.readyState) {
      case 0:
        if (typeof(options.aborted) === "function") {
          options.aborted.call(scope, options, this);
        }
        break;
      case 4:
        if (xhr.status === 200){
          var data;
          var contentType = xhr.getResponseHeader("Content-Type");
          if (contentType) {
            var i = contentType.indexOf(";charset=");
            if (i !== -1) {
              var encoding = contentType.substr(i + ";charset=".length);
              contentType = contentType.substr(0, i);
            }
          }
          try {
            switch (contentType) {
              case "application/json":
                data = JSON.parse(xhr.responseText);
                break;
              case "application/javascript":
              case "text/javascript":
                data = eval(xhr.responseText);
                break;
              case "application/xml":
              case "text/xml":
                data = xhr.responseXML;
                break;
              default:
                data = xhr.responseText;
            }
            if (typeof(options.success) === "function") {
              options.success.call(scope, options, this, data);
            }
          }
          catch (exception) {
            if (typeof(options.failure) === "function") {
              options.failure.call(scope, options, this, exception);
            }
          }
        }
        else {
          if (typeof(options.failure) === "function") {
            options.failure.call(scope, options, this, {
              type: "http",
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText
            });
          }
        }
        break;
    }
  };
  if (options.headers) {
    for (name in options.headers) {
      xhr.setRequestHeader(name, options.headers[name]);
    }
  }
  var data = null;
  if (options.data) {
    if (typeof(options.data) === "object" && data !== null) {
      data = "";
      var p;
      for (p in options.data) {
        data += p + "=" + options.data[p];
      }
    }
    else {
      data = options.data;
    }
  }
  xhr.send(data);
  return xhr;
}

/**
*
*   The Phile class provides a javascript API to work with Pentaho files.
*
*   The optional options parameter sets standard options for this Phile instance.
*   Any global options present in Phile.options are applied if not present in options.
*   Please checkout the <code><a href="#property_defaultOptions">defaultOptions</a></code> property to see the supported options.
*
*   @class Phile
*   @constructor
*   @param options Object standard options
*/
var Phile = function(options) {
  var option, myOptions = {};
  if (options) {
    for (option in options) {
      myOptions[option] = options[option];
    }
  }
  options = Phile.defaultOptions;
  for (option in options) {
    if (typeof(myOptions[option]) === "undefined") {
      myOptions[option] = options[option];
    }
  }
  this.options = myOptions;
};

/**
* These are the default options used for new Phile instances.
* These can always be overriden by passing an options object to the constructor
* It sets the following properties:
* <ul>
*   <li><code>requestTimeout</code> int: <code>30000</code> - number of milliseconds before a request to the Pentaho repository service will timeout </li>
*   <li><code>async</code> boolean: <code>true</code> - determines whether synchronous or asynchronous communication will be used.</li>
*   <li><code>webapp</code> String: <code>"pentaho"</code> - Name of the pentaho web application. You might need to change this if you changed the default name of the pentaho web application.</li>
*   <li><code>mountPoint</code> String: <code>"api"</code> - Root of all api webservices. Probably won't need to change this ever.</li>
*   <li><code>dirService</code> String: <code>"repo/dirs"</code> - Entrypoint for the dirs webservices. See http://javadoc.pentaho.com/bi-platform500/webservice500/resource_DirectoryResource.html
*   <li><code>fileService</code> String: <code>"repo/files"</code> - Entrypoint for the files webservices. See: <a href="http://javadoc.pentaho.com/bi-platform500/webservice500/resource_FileResource.html">http://javadoc.pentaho.com/bi-platform500/webservice500/resource_FileResource.html</a></li>
*   <li><code>sessionService</code> String: <code>"session"</code> - Entrypoint for the session webservices. See: <a href="http://javadoc.pentaho.com/bi-platform500/webservice500/resource_SessionResource.html">http://javadoc.pentaho.com/bi-platform500/webservice500/resource_SessionResource.html</a></li>
* </ul>
*
*  @property defaultOptions
*  @static
*  @type Object
**/
Phile.defaultOptions = {
  requestTimeout: 30000,      //by default, we bail out after 30 seconds
  async: true,               //by default, we do a synchronous request
  webapp: "pentaho",
  mountPoint: "api",
  dirService: "repo/dirs",
  fileService: "repo/files",
  sessionService: "session"
};

/**
*  Separator between path components.
*  @property separator
*  @static
*  @type String
**/
Phile.separator = "/";

/**
*  Create a comparator to sort files.
*  Normally, you don't need this method: you can use one of the prefabricated sort methods.
*
*  @property createFileComparator
*  @static
*  @type function
**/
Phile.createFileComparator = function(obj){
  return function(a, b){
    if (a.file) {
      a = a.file;
    }
    if (b.file) {
      b = b.file;
    }
    var key, spec, convert, direction, vA, vB;
    for (key in obj) {
      spec = obj[key] || {};
      vA = a[key];
      vB = b[key];
      if (typeof(spec.convert) === "function") {
        vA = spec.convert(vA);
        vB = spec.convert(vB);
      }
      direction = spec.direction || 1;
      if (vA > vB) {
        return direction*1;
      }
      else
      if (vA < vB) {
        return direction*-1;
      }
      else {
        continue;
      }
    }
    return 0;
  };
};

/**
*  Case-sensitive file sort function, by path.
*  Can be passed to the Array <code>sort</code> function to sort an array of files returned by the <a href="#method_getChildren"><code>getChildren()</code></a> method.
*  This sorts files strictly by alphabetical order of path
*
*  @property compareFilesByPathCS
*  @static
*  @type function
**/
Phile.compareFilesByPathCS = Phile.createFileComparator({
  path: null
});

/**
*  Case-sensitive file sort function, by original path and name.
*  Can be passed to the Array <code>sort</code> function to sort an array of files returned by the <a href="#method_getChildren"><code>getChildren()</code></a> method.
*  This sorts files strictly by alphabetical order of path
*
*  @property compareFilesByOriginalPathAndName
*  @static
*  @type function
**/
Phile.compareFilesByOriginalPathAndName = Phile.createFileComparator({
  originalParentFolderPath: null,
  name: null
});

/**
*  Case-sensitive file sort function, by title.
*  Can be passed to the Array <code>sort</code> function to sort an array of files returned by the <a href="#method_getChildren"><code>getChildren()</code></a> method.
*  This sorts folder before files and then by (case-sensitive) name
*
*  @property compareFilesByTitleCS
*  @static
*  @type function
**/
Phile.compareFilesByTitleCS = Phile.createFileComparator({
  folder: {direction: -1},
  title: null
});

/**
*  Case-insensitive file sort function.
*  Can be passed to the Array <code>sort</code> function to sort an array of files returned by the <a href="#method_getChildren"><code>getChildren()</code></a> method.
*  This sorts folder before files and then by (case-insensitive) name
*
*  @property compareFilesByTitleCI
*  @static
*  @type function
**/
Phile.compareFilesByTitleCI = Phile.createFileComparator({
  folder: {direction: -1},
  title: {convert: function(value){return value.toUpperCase();}}
});

Phile.prototype = {
  getUrl: function(service, path, action){
    var options = this.options;
    var service = service || options.fileService;
    var url = "/" + options.webapp + "/" + options.mountPoint + "/" + service;

    if (path) {
      path = typeof(path.join) === "function" ? path.join(":") : escapePath(path);
      path = encodeURI(path);
      if (path) {
        url += "/" + path;
      }
    }
    else {
      //don't default the path. Let the service decide, or fail the request.
    }

    if (action) {
      url += "/" + action;
    }
    return url;
  },
/**
*   This is the core method to do a request to the Pentaho file service.
*   Normally, you do not need to use this method directy, rather use a specific method like
*   <code><a href="#method_getChildren">getChildren()</a></code>,
*   <code><a href="#method_getTree">getTree()</a></code>,
*   <code><a href="#method_getContents">getContents()</a></code>,
*   <code><a href="#method_getProperties">getProperties()</a></code>,
*   or <code><a href="#method_save">save()</a></code>.
*
*   The method takes one <code>conf</code> argument which represents the message to send to the service.
*   The <code>conf</code> argument supports the following generic properties:
*   <dl>
*     <dt><code>success</code></dt>
*     <dd>A callback function to be called when the service responds successfully.
*       The callback is passed the following arguments: <dl>
*         <dt><code>options</code></dt>
*         <dd>The conf object that was passed to the request method, i.e., the request.</dd>
*         <dt><code>xhr</code></dt>
*         <dd>The XMLHttpRequest used for this request. Useful if you want to get response headers or process the raw response.</dd>
*         <dt><code>response</code></dt>
*         <dd>An object that represents the response. Its structure is (obviously) dependent upon the specific request.</dd>
*       </dl>
*     </dd>
*     <dt><code>failure</code></dt>
*     <dd>A callback function to be called when the service did not respond successfully.
*       The callback is passed the following arguments: <dl>
*         <dt><code>options</code></dt>
*         <dd>The conf object that was passed to the request method, i.e., the request.</dd>
*         <dt><code>xhr</code></dt>
*         <dd>The XMLHttpRequest used for this request. Useful if you want to get response headers or process the raw response.</dd>
*         <dt><code>exception</code></dt>
*         <dd>An object that represents the error</dd>
*       </dl>
*     </dd>
*     <dt><code>scope</code></dt>
*     <dd>The scope to use for the callbacks (defaults to null).</dd>
*     <dt><code>headers</code></dt>
*     <dd>
*        An object to hold any HTTP request headers. The property names of this object are used as HTTP header names, and property values are used as the corresponding header values.
*     </dd>
*     <dt><code>params</code></dt>
*     <dd>An object to hold any HTTP query parameters. The property names of this object are used as parameter names, and their corresponding values as parameter values.</dd>
*     <dt><code>data</code></dt>
*     <dd>The message body to send to the server.</dd>
*   </dl>
*
*   @method request
*   @param {object} conf An object representing the message.
*   @return {DOMDocument}
*/
  request: function(conf){
    var options = this.options;
    var scope = conf.scope || null;
    var success = conf.success;
    var failure = conf.failure;
    var service = conf.service || options.fileService;
    conf.url = this.getUrl(service, conf.path, conf.action);
    return ajax(conf);
  },
/**
*   This method can be used to get the contents of a directory.
*   The method is passed a configuration object to specify callbacks and the path from where to get children from.
*   The configuration object supports all generic configuration properties as documented in the <code><a href="#method_request">request()</a></code> method.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the folder for which to get the children. You can specify the as a string or an array of path components. If the path is specified as a string, you can separate path components either with a forward slash or with a semi-colon.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying a path you can also specify a file object of the type "folder".
*       When file is specified it will overwrite (and thus, also override) the path property.
*     </dd>
*     <dt><code>showHidden</code></dt>
*     <dd>Boolean to specify whether hidden files should be included in the response</dd>
*     <dt><code>filter</code></dt>
*     <dd>String to specify a search string to filter the result.</dd>
*   </dl>
*   The response object passed back to the <code>success</code> callback has one property <code>repositoryFileDto</code>.
*   This is an array representing the list of children. Array items have the following properties: <dl>
*     <dt><code>aclNode</code></dt>
*     <dd>String <code>"true"</code> or <code>"false"</code> to flag if this is an ACL node or not.</dd>
*     <dt><code>createdDate</code></dt>
*     <dd>A string that can be parsed as an integer to get the timestamp indicating the date/time this node was created.</dd>
*     <dt><code>fileSize</code></dt>
*     <dd>A string that can be parsed as an integer to get the size (in bytes) of this node in case this node represents a file. If a filesize is not applicable for this node, it is <code>"-1"</code>.</dd>
*     <dt><code>folder</code></dt>
*     <dd>String <code>"true"</code> or <code>"false"</code> to flag if this is node represents a folder or not.</dd>
*     <dt><code>hidden</code></dt>
*     <dd>String <code>"true"</code> or <code>"false"</code> to flag if this is node is hidden for the end user or not.</dd>
*     <dt><code>id</code></dt>
*     <dd>A GUID identifiying this node.</dd>
*     <dt><code>locale</code></dt>
*     <dd>The current locale used for localized properties like <code>title</code>.</dd>
*     <dt><code>localeMapEntries</code></dt>
*     <dd>
*       This is an array of localized properties for this file. The array items have these properties:
*       <dl>
*         <dt><code>locale</code></dt>
*         <dd>
*           The name of the locale for this map of localized properties.
*           There is also a special <code>"default"</code> locale indicating the current locale.
*         </dd>
*         <dt><code>properties</code></dt>
*         <dd>
*           This is a bag of name/value pairs representing localized properties.
*           <dl>
*             <dt><code>key</code></dt>
*               <dd>The key for this property.</dd>
*             <dt><code>value</code></dt>
*               <dd>The localized value for this property.</dd>
*           </dl>
*         </dd>
*       </dl>
*     </dd>
*     <dt><code>locked</code></dt>
*     <dd>String <code>"true"</code> or <code>"false"</code> to flag if this is node is locked or not.</dd>
*     <dt><code>name</code></dt>
*     <dd>The name of this node.</dd>
*     <dt><code>ownerType</code></dt>
*     <dd>A string that can be parsed as an integer indicating the owner type.</dd>
*     <dt><code>path</code></dt>
*     <dd>A string containing the forward slash separated path components.</dd>
*     <dt><code>title</code></dt>
*     <dd>The title for presenting this node to the user.</dd>
*     <dt><code>versioned</code></dt>
*     <dd>String <code>"true"</code> or <code>"false"</code> to flag if this is node is versioned or not.</dd>
*     <dt><code>versionId</code></dt>
*     <dd>If the file is versioned, the <code>versionId</code> property is present and its value is a String that represents the version number.</dd>
*   </dl>
*   @method getChildren
*   @param {object} conf Object specifies where to get children from
*/
  getChildren: function(conf) {
    if (conf.file) {
      ensureFolder(conf.file);
      conf.path = conf.file.path;
    }
    conf.service = this.options.fileService;
    if (!conf.path) {
      conf.path = "";
    }
    if (!conf.params) {
      conf.params = {};
    }
    if (typeof(conf.showHidden) !== "undefined") {
      conf.params.showHidden = Boolean(conf.showHidden);
    }
    if (typeof(conf.filter) !== "undefined") {
      conf.params.filter = String(conf.filter);
    }
    if (!conf.headers) {
      conf.headers = {};
    }
    if (!conf.headers.Accept) {
      conf.headers.Accept = "application/json";
    }
    if (typeof(conf.action) === "undefined") {
      conf.action = "children";
    }
    conf.method = "GET";
    return this.request(conf);
  },
/**
*   This method can be used to get the entire tree of files.
*   The configuration object supports all generic configuration properties as documented in the <code><a href="#method_request">request()</a></code> method.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the folder for which to get the children. You can specify the as a string or an array of path components. If the path is specified as a string, you can separate path components either with a forward slash or with a semi-colon.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying a path you can also specify a file object of the type "folder".
*       When file is specified it will overwrite (and thus, also override) the path property.
*     </dd>
*     <dt><code>showHidden</code></dt>
*     <dd>Boolean to specify whether hidden files should be included in the response</dd>
*     <dt><code>filter</code></dt>
*     <dd>String to specify a search string to filter the result.</dd>
*     <dt><code>depth</code></dt>
*     <dd>Integer. Specifies the number of levels to traverse. Default: <code>1</code>.</dd>
*   </dl>
*   The response object passed back to the <code>success</code> callback has two properties: <dl>
*     <dt><code>file</code></dt>
*     <dd>The <code>file</code> property is an object type which holds the properties of the file that is the root of the tree, i.e. the properties of the file identified by the path specified in the argument <code>conf</code> object.</dd>
*     <dt><code>children</code></dt>
*     <dd>
*       Optional. The <code>children</code> property is an array of objects representing the children of the file identified by the path specified in the argument <code>conf</code> object.
*       Each of these objects again has a <code>file</code> property, and optionally, a <code>children</code> property.
*     </dd>
*   </dl>.
*   @method getTree
*   @param {object} conf Object specifies where and how to get a tree of file objects from.
*/
  getTree: function(conf) {
    if (!conf.params) {
      conf.params = {};
    }
    var depth = conf.depth || 1;
    if (!conf.params.depth) {
      conf.params.depth = depth;
    }
    conf.action = "tree";
    return this.getChildren(conf);
  },
/**
*   Get the contents of the trash bin.
*   The response object passed back to the <code>success</code> is an array of <code>repositoryFileDto</code> objects.
*   The structure of these objects are described by the <a href="#method_getChildren"><code>getChildren</code></a> method.
*   @method getTrash
*   @param {object} conf Object specifies callbacks.
*/
  getTrash: function(conf){
    if (!conf) {
      conf = {};
    }
    if (!conf.params) {
      conf.params = {};
    }
    conf.action = "deleted";
    return this.getChildren(conf);
  },
/**
*   This method can be used to get the contents of a particular file.
*   The configuration object supports all generic configuration properties as documented in the <code><a href="#method_request">request()</a></code> method.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the folder for which to get the children. You can specify the as a string or an array of path components. If the path is specified as a string, you can separate path components either with a forward slash or with a semi-colon.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying a path you can also specify a file object of the type "file".
*       When file is specified it will overwrite (and thus, also override) the path property.
*     </dd>
*   </dl>
*   Phile is not aware of content types, so callers are responsible for setting an appropriate mime type in the <code>Accept</code> HTTP-header.
*   @method getContents
*   @param {object} conf Object specifies the file to get the contents from and the callbacks to be notified.
*/
  getContents: function(conf) {
    if (conf.file) {
      ensureFile(conf.file);
      conf.path = conf.file.path;
    }
    conf.service = this.options.fileService;
    conf.action = null;
    conf.method = "GET";
    return this.request(conf);
  },
/**
*   This method can be used to get a url to download a particular file.
*   The method takes a single <code>path</code> argument to specify which file to download.
*   The <code>path</code> argument may also be a file object.
*   @method getUrlForDownload
*   @param {string} path Path specifies which file to download. Can be specified as a string or an array of path components. Instead of passing a path you can also pass a file object.
*   @type {string} Returns the url to download the file.
*/
  getUrlForDownload: function(path){
    if (path.path) {
      path = path.path;
    }
    var service = this.options.fileService;
    var url = this.getUrl(service, path, "download");
    return url;
  },
/**
*   This method can be used to get properties (metadata) of a particular file or directory.
*   The method takes a single <code>conf</code> argument to specify for which file to get properties,
*   and which callbacks to notify when the properties are received.
*   The configuration object supports all generic configuration properties as documented in the <code><a href="#method_request">request()</a></code> method.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the folder for which to get the children. You can specify the as a string or an array of path components. If the path is specified as a string, you can separate path components either with a forward slash or with a semi-colon.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying a path you can also specify a file object of the type "file".
*       When file is specified it will overwrite (and thus, also override) the path property.
*     </dd>
*   </dl>
*   The properties object that is returned to the callback has the same structure as the items returned by the <a href="#method_getChildren"><code>getChildren()</code></a> method.
*   @method getProperties
*   @param {object} conf Specifies the node for which to get properties and the callbacks to be notified.
*/
  getProperties: function(conf) {
    if (conf.file) {
      conf.path = conf.file.path;
    }
    conf.service = this.options.fileService;
    if (!conf.headers) {
      conf.headers = {};
    }
    if (!conf.headers.Accept) {
      conf.headers.Accept = "application/json";
    }
    conf.action = "properties";
    conf.method = "GET";
    return this.request(conf);
  },
  _create: function(conf) {
    conf.method = "PUT";
    var _success, _scope;
    if (conf.success) {
      _success = conf.success;
      _scope = conf.scope || null;
    }
    var success = function(options, xhr, data){
      var top = window.top;
      var mantle_fireEvent = top.mantle_fireEvent;
      if (typeof(mantle_fireEvent) === "function") {
        mantle_fireEvent.call(top, "GenericEvent", {"eventSubType": "RefreshBrowsePerspectiveEvent"});
        mantle_fireEvent.call(top, "GenericEvent", {"eventSubType": "RefreshCurrentFolderEvent"});
      }
      if (typeof(_success) === "function") {
        _success.call(_scope, options, xhr, data);
      }
    }
    conf.success = success;
    return this.request(conf);
  },
/**
*   This method creates a new directory.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the path of the new directory</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying a path you can also specify a file object of the type "file".
*       When file is specified it will overwrite (and thus, also override) the path property.
*     </dd>
*   </dl>
*   @method createDirectory
*   @param {object} conf Specifies the path for the new directory and the callbacks to be notified.
*/
  createDirectory: function(conf) {
    if (conf.file) {
      conf.path = conf.file.path;
    }
    conf.service = this.options.dirService;
    return this._create(conf);
  },
/**
*   This method can be used to save a file to the repository.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the path of the new file. You can specify the as a string or an array of path components. If the path is specified as a string, you can separate path components either with a forward slash or with a semi-colon.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying a path you can also specify a file object of the type "file".
*       When file is specified it will overwrite (and thus, also override) the path property.
*     </dd>
*     <dt><code>data</code></dt>
*     <dd>The contents of the new file</dd>
*   </dl>
*   @method saveFile
*   @param {object} conf Specifies the path for the new file and the callbacks to be notified.
*/
  saveFile: function(conf) {
    if (conf.file) {
      conf.path = conf.file.path;
    }
    conf.service = this.options.fileService;
    return this._create(conf);
  },
/**
*   Get the home directory of a user.
*   Specific properties: <dl>
*     <dt><code>user</code></dt>
*     <dd>String (optional). Specifies the user for which to get the home directory. If the user is omitted, it gets the home directory of the current user.</dd>
*   </dl>
*   @method getUserHomeDir
*   @param {Object} conf Specifies the callbacks to be notified.
*/
  getUserHomeDir: function(conf){
    conf.service = this.options.sessionService;
    if (conf.user) {
      conf.path = "workspaceDirForUser";
      conf.action = conf.user;
    }
    else {
      delete conf.path;
      conf.action = "userWorkspaceDir";
    }
    return this.request(conf);
  },
/**
*   Discards the file or directory.
*   Specific properties: <dl>
*     <dt><code>id</code></dt>
*     <dd>String (optional). The guid of the file or directory to remove.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying an id you can also specify a file object to use its id.
*     </dd>
*     <dt><code>path</code></dt>
*     <dd>
*       String (optional). The path of the file or directory to remove.
*       If you specify a path but not an id, two requests are made:
*       one to retrieve the properties of the file at the specified path,
*       and then an actual delete by id.
*       Discarding by path does not work for items that are in the trash.
*     </dd>
*     <dt><code>permanent</code></dt>
*     <dd>Boolean (optional). If true, the object is removed permanently. If not, it is moved to the trash folder.</dd>
*   </dl>
*   @method discard
*   @param {object} conf Specifies the callbacks to be notified.
*/
  discard: function(conf) {
    var id = conf.file? conf.file.id : conf.id;
    if (id) {
      conf.id = id;
      delete conf.path;
      conf.service = this.options.fileService;
      conf.method = "PUT";
      conf.action = (conf.permanent === true) ? "deletepermanent" : "delete";
      conf.data = conf.id;
      this.request(conf);
    }
    else
    if (conf.path) {
      var me = this;
      this.getProperties({
        path: conf.path,
        success: function(options, xhr, data){
          conf.id = data.id;
          me.discard(conf);
        },
        failure: function(options, xhr, exception) {
          if (typeof(conf.failure) === "function") {
            conf.failure.call(conf.scope, options, xhr, exception);
          }
        }
      });
    }
  },
/**
*   Restores the file or directory.
*   Specific properties: <dl>
*     <dt><code>id</code></dt>
*     <dd>String. The guid of the file or directory to restore.</dd>
*     <dt><code>file</code></dt>
*     <dd>
*       Instead of specifying an id you can also specify a file object to use its id.
*     </dd>
*   </dl>
*   @method restore
*   @param {object} conf Specifies the callbacks to be notified.
*/
  restore: function(conf){
    conf.service = this.options.fileService;
    conf.action = "restore";
    conf.method = "PUT";
    conf.data = conf.file? conf.file.id : conf.id;
    this.request(conf);
  },
/**
*   Rename a file.
*   The method takes a single <code>conf</code> argument to specify for which file to get properties,
*   and which callbacks to notify when the properties are received.
*   The configuration object supports all generic configuration properties as documented in the <code><a href="#method_request">request()</a></code> method.
*   Specific properties: <dl>
*     <dt><code>path</code></dt>
*     <dd>Specifies the file to rename.</dd>
*     <dt><code>newName</code></dt>
*     <dd>Specifies the new name for the file.</dd>
*   </dl>
*   @method rename
*   @param {object} conf Specifies the node for which to get properties and the callbacks to be notified.
*/
  rename: function(conf) {
    conf.service = this.options.fileService;
    conf.action = "rename";
    conf.method = "PUT";
    if (conf.file) {
      conf.path = conf.file.path;
    }
    if (!conf.params) {
      conf.params = {};
    }
    conf.params["newName"] = conf.newName;
    if (!conf.headers) {
      conf.headers = {};
    }
    if (!conf.headers.Accept) {
      conf.headers.Accept = "application/xml";
    }
    this.request(conf);
  }
}

if (typeof(define) === "function" && define.amd) {
  define(function (){
    return Phile;
  });
}
else {
  exports.Phile = Phile;
}
return Phile;
})(typeof exports === "undefined" ? window : exports);
