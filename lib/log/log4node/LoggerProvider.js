define(["./Logger"],function(Logger) {


  function LoggerProvider(mainLog) {
    this.loggers = {};
    this.mainLog = mainLog;
  }
  
  LoggerProvider.prototype = {
      
      getLogger: function(category) {
        if (!this.loggers[category]) {
          this.loggers[category] = new Logger(this.mainLog,category);
        }
        return this.loggers[category];
      }
      
  };

  return LoggerProvider;
});
