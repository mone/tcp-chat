
define([],function() {
  
  var Logger = function(mainLog,category) {
    this.log = mainLog.clone({prefix: "%d | %p | %l | " + category + " | "})
  };
  

  Logger.prototype = {

      
      fatal: function(message,exception) {
        this.log.critical(message,exception);
      },
      
      isFatalEnabled: function() {
        return true;
      },

      error: function(message,exception) {
      	this.log.error(message,exception);
      },
      
      isErrorEnabled: function() {
        return true;
      },
      
      warn: function(message,exception) {
      	this.log.warning(message,exception);
      },
      
      isWarnEnabled: function() {
        return true;
      },

      info: function(message,exception) {
      	this.log.info(message,exception);
      },

      isInfoEnabled: function() {
        return true;
      },
      
      debug: function(message,exception) {
        this.log.debug(message,exception);
      },

      isDebugEnabled: function() {
        return true;
      }
  };
  
  return Logger;
  
});  
