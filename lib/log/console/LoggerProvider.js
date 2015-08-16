define(["./Logger"],function(Logger) {

	var loggers = {};
  
  return {
      
      getLogger: function(category) {
        if (!loggers[category]) {
        	loggers[category] = new Logger(category);
        }
        return loggers[category];
      }
      
  };
  
});