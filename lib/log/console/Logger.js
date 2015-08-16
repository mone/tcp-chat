
define([],function() {
  
  var Logger = function(category) {
  	this.category = category;
  };
  

  Logger.prototype = {
  		
  		log: function(m,e) {
		  	console.log(new Date() + " | " + this.category + " | " + m);
		  	if(e) {
		  		console.log(e);
		  	}
  		},
      
      fatal: function(message,exception) {
        this.log(message,exception);
      },
      
      isFatalEnabled: function() {
        return true;
      },

      error: function(message,exception) {
      	this.log(message,exception);
      },
      
      isErrorEnabled: function() {
        return true;
      },
      
      warn: function(message,exception) {
      	this.log(message,exception);
      },
      
      isWarnEnabled: function() {
        return true;
      },

      info: function(message,exception) {
      	this.log(message,exception);
      },

      isInfoEnabled: function() {
        return true;
      },
      
      debug: function(message,exception) {
      	this.log(message,exception);
      },

      isDebugEnabled: function() {
        return true;
      }
  };
  
  return Logger;
  
});  