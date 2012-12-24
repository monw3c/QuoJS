/*
  QuoJS 2.2.0
  (c) 2011, 2012 Javi Jiménez Villar (@soyjavi)
  http://quojs.tapquo.com
*/

(function($$) {
  var DEFAULT, JSONP_ID, MIME_TYPES, _isJsonP, _parseResponse, _xhrError, _xhrForm, _xhrHeaders, _xhrStatus, _xhrSuccess, _xhrTimeout;
  DEFAULT = {
    TYPE: "GET",
    MIME: "json"
  };
  MIME_TYPES = {
    script: "text/javascript, application/javascript",
    json: "application/json",
    xml: "application/xml, text/xml",
    html: "text/html",
    text: "text/plain"
  };
  JSONP_ID = 0;
  $$.ajaxSettings = {
    type: DEFAULT.TYPE,
    async: true,
    success: {},
    error: {},
    context: null,
    dataType: DEFAULT.MIME,
    headers: {},
    xhr: function() {
      return new window.XMLHttpRequest();
    },
    crossDomain: false,
    timeout: 0
  };
  $$.ajax = function(options) {
    var abortTimeout, settings, xhr;
    settings = $$.mix($$.ajaxSettings, options);
    if (settings.type === DEFAULT.TYPE) {
      settings.url += $$.serializeParameters(settings.data, "?");
    } else {
      settings.data = $$.serializeParameters(settings.data);
    }
    if (_isJsonP(settings.url)) {
      return $$.jsonp(settings);
    }
    xhr = settings.xhr();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        clearTimeout(abortTimeout);
        return _xhrStatus(xhr, settings);
      }
    };
    xhr.open(settings.type, settings.url, settings.async);
    _xhrHeaders(xhr, settings);
    if (settings.timeout > 0) {
      abortTimeout = setTimeout(function() {
        return _xhrTimeout(xhr, settings);
      }, settings.timeout);
    }
    try {
      xhr.send(settings.data);
    } catch (error) {
      xhr = error;
      _xhrError("Resource not found", xhr, settings);
    }
    if (settings.async) {
      return xhr;
    } else {
      return _parseResponse(xhr, settings);
    }
  };
  $$.jsonp = function(settings) {
    var abortTimeout, callbackName, script, xhr;
    if (settings.async) {
      callbackName = "jsonp" + (++JSONP_ID);
      script = document.createElement("script");
      xhr = {
        abort: function() {
          $$(script).remove();
          if (callbackName in window) {
            return window[callbackName] = {};
          }
        }
      };
      abortTimeout = void 0;
      window[callbackName] = function(response) {
        clearTimeout(abortTimeout);
        $$(script).remove();
        delete window[callbackName];
        return _xhrSuccess(response, xhr, settings);
      };
      script.src = settings.url.replace(RegExp("=\\?"), "=" + callbackName);
      $$("head").append(script);
      if (settings.timeout > 0) {
        abortTimeout = setTimeout(function() {
          return _xhrTimeout(xhr, settings);
        }, settings.timeout);
      }
      return xhr;
    } else {
      return console.error("QuoJS.ajax: Unable to make jsonp synchronous call.");
    }
  };
  $$.get = function(url, data, success, dataType) {
    return $$.ajax({
      url: url,
      data: data,
      success: success,
      dataType: dataType
    });
  };
  $$.post = function(url, data, success, dataType) {
    return _xhrForm("POST", url, data, success, dataType);
  };
  $$.put = function(url, data, success, dataType) {
    return _xhrForm("PUT", url, data, success, dataType);
  };
  $$["delete"] = function(url, data, success, dataType) {
    return _xhrForm("DELETE", url, data, success, dataType);
  };
  $$.json = function(url, data, success) {
    return $$.ajax({
      url: url,
      data: data,
      success: success,
      dataType: DEFAULT.MIME
    });
  };
  $$.serializeParameters = function(parameters, character) {
    var parameter, serialize;
    if (character == null) {
      character = "";
    }
    serialize = character;
    for (parameter in parameters) {
      if (parameters.hasOwnProperty(parameter)) {
        if (serialize !== character) {
          serialize += "&";
        }
        serialize += parameter + "=" + parameters[parameter];
      }
    }
    if (serialize === character) {
      return "";
    } else {
      return serialize;
    }
  };
  _xhrStatus = function(xhr, settings) {
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
      if (settings.async) {
        _xhrSuccess(_parseResponse(xhr, settings), xhr, settings);
      }
    } else {
      _xhrError("QuoJS.ajax: Unsuccesful request", xhr, settings);
    }
  };
  _xhrSuccess = function(response, xhr, settings) {
    settings.success.call(settings.context, response, xhr);
  };
  _xhrError = function(type, xhr, settings) {
    settings.error.call(settings.context, type, xhr, settings);
  };
  _xhrHeaders = function(xhr, settings) {
    var header;
    if (settings.contentType) {
      settings.headers["Content-Type"] = settings.contentType;
    }
    if (settings.dataType) {
      settings.headers["Accept"] = MIME_TYPES[settings.dataType];
    }
    for (header in settings.headers) {
      xhr.setRequestHeader(header, settings.headers[header]);
    }
  };
  _xhrTimeout = function(xhr, settings) {
    xhr.onreadystatechange = {};
    xhr.abort();
    _xhrError("QuoJS.ajax: Timeout exceeded", xhr, settings);
  };
  _xhrForm = function(method, url, data, success, dataType) {
    return $$.ajax({
      type: method,
      url: url,
      data: data,
      success: success,
      dataType: dataType,
      contentType: "application/x-www-form-urlencoded"
    });
  };
  _parseResponse = function(xhr, settings) {
    var response;
    response = xhr.responseText;
    if (response) {
      if (settings.dataType === DEFAULT.MIME) {
        try {
          response = JSON.parse(response);
        } catch (error) {
          response = error;
          _xhrError("QuoJS.ajax: Parse Error", xhr, settings);
        }
      } else {
        if (settings.dataType === "xml") {
          response = xhr.responseXML;
        }
      }
    }
    return response;
  };
  _isJsonP = function(url) {
    return RegExp("=\\?").test(url);
  };
})(Quo);
