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
        that._onReceivedMessage(line);
      });

    },

    _onReceivedMessage: function(message) {
      if (this.closed) {
        //ignore
        log.debug(this.id + " Client already terminated, ignore message.");
        return;
      }
      if (log.isDebugLogEnabled()) {
        log.debug(this.id + " received a line: " + message);
      }
      this.emit("message",message);
    },

    sendMessage: function(message) {
      if (this.closed) {
        log.debug(this.id + " Client already terminated, can't send message.");
        return;
      }
      if (log.isDebugLogEnabled()) {
        log.debug(this.id + " writing on socket: " + message);
      }
      this.socket.write(message);
    },

    close: function() {
      if (this.closed) {
        log.debug(this.id + " Already closing");
        //someone else already handled the case
        return;
      }
      log.info(this.id + " Closing socket");
      this.closed = true;
      this.socket.end();
      this.emit("disconnected");
    }

  };

  return Inheritance(Client, events.EventEmitter);
});
