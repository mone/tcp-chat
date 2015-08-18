
define([],function() {
  
  var Logger = function(mainLog,category) {
    this.log = mainLog.clone({prefix: "%d | %p | %l | " + category + " | "})
  };
  

  Logger.prototype = {

      
      fatal: function(message,exception) {
        this.log.critical(message);
      },
      
      isFatalEnabled: function() {
        return true;
      },

      error: function(message,exception) {
      	this.log.error(message);
      },
      
      isErrorEnabled: function() {
        return true;
      },
      
      warn: function(message,exception) {
      	this.log.warning(message);
      },
      
      isWarnEnabled: function() {
        return true;
      },

      info: function(message,exception) {
      	this.log.info(message);
      },

      isInfoEnabled: function() {
        return true;
      },
      
      debug: function(message,exception) {
        this.log.debug(message);
      },

      isDebugEnabled: function() {
        return true;
      }
  };
  
  return Logger;
  
});  
