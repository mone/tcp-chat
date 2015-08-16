define(["./log/LoggerManager","split","events","./util/Inheritance"],
  function(LoggerManager,split,events,Inheritance) {

  var log = LoggerManager.getLoggerProxy("Client");

  function Client(id,socket) {
    this.id = id;
    this.socket = socket;
    this.closed = false;

    this._listenToSocket();
  }

  Client.prototype = {

    _listenToSocket: function() {
      var that = this;

      this.socket.on("end",function() {
        log.debug(that.id + " fin received, let's agree");
        that.close();
      });

      this.socket.on("error",function(error) {
        log.info(that.id + " got error: " + error);
        //close should fire soon, no need to wait though
        that.close();
      });

      this.socket.on("close",function(hadError) {
        if (hadError) {
          log.debug(that.id + " is now closed (network error)");
        } else {
          log.debug(that.id + " is now closed");
        }
        that.close();
      });

      this.socket.pipe(split()).on("data",function(line) {
        if (log.isDebugLogEnabled()) {
          log.debug(that.id + " received a line: " + line);
        }
        that.emit("message",line);
      });

    },

    sendMessage: function(message) {
      if (this.closed) {
        if (log.isDebugLogEnabled()) {
          log.debug(this.id + " Client already terminated, can't send message.");
        }
        return;
      }
      this.socket.write(message);
    },

    close: function() {
      if (this.closed) {
        //someone else already handled the case
        return;
      }
      log.debug(this.id + " Closing socket");
      this.closed = true;
      this.socket.end();
      this.emit("disconnected");
    }

  };

  return Inheritance(Client, events.EventEmitter);
});
