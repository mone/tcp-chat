define(["./log/LoggerManager","./util/Inheritance","events","net","split"],
  function(LoggerManager,Inheritance,events,net,split) {

  var CONNECTING = "connecting";
  var CONNECTED = "connected";
  var DISCONNECTED = "disconnected";
  var PAUSED = "paused";

  var log = LoggerManager.getLoggerProxy("RemoteServerClient");

  function RemoteServerClient(id,remoteHost,remotePort) {
    this.id = id;
    this.socket = null;
    this.remoteHost = remoteHost;
    this.remotePort = remotePort;

    this.listenId = 0;
    this.status = DISCONNECTED;

    this.nextTimeout = 0;
    this.retrying = null;

  };


  RemoteServerClient.prototype = {

    is: function(status) {
      return this.status == status;
    },

    _setStatus: function(newStatus) {
      if (newStatus == DISCONNECTED) {
        this.listenId++;
      }

      this.status = newStatus;

      var that = this;
      process.nextTick(function() {
        that.emit(newStatus);
      });
    },

    _clearTimeout: function(keepDelay) {
      clearTimeout(this.retrying);
      if (!keepDelay) {
        this.nextTimeout = 0;
      }
    },

    connect: function() {
      if (this.is(CONNECTED) || this.is(CONNECTING)) {
        log.debug("Connection requested while already "+this.status+", just wait");
        return;
      } else if(this.is(PAUSED)) {
        this._clearTimeout(true);
      }
      log.info("Connection to remote cluster requested " + this.remoteHost+":"+this.remotePort);

      this._setStatus(CONNECTING);

      this.socket = new net.Socket();
      this.socket.connect(this.remotePort, this.remoteHost);


      var that = this;
      var socketId = Number(this.listenId);

      this.socket.on("connect",function() {
        if (socketId === that.listenId) {
          that._onConnection();
        } // else old socket event
      });
      this.socket.pipe(split()).on("data",function(data) {
        if (socketId === that.listenId) {
          that._onMessage(data);
        } // else old socket event
      });
      this.socket.on("error",function(err) {
        if (socketId === that.listenId) {
          that._onError(err);
        } // else old socket event
      });
      this.socket.on("close",function(withError) {
        if (socketId === that.listenId) {
          that._onDisconnection(withError);
        } // else old socket event
      });
    },

    disconnect: function() {
      if (this.is(DISCONNECTED)) {
        log.debug("Disconnection requested while already disconnected, nothing to do");
        return;
      }
      log.info("Disconnection from remote cluster server");

      this._clearTimeout();
      this._setStatus(DISCONNECTED);
      if (this.socket) {
        this.socket.end();
        this.socket = null;
      }

    },

    send: function (message) {
      if (!this.is(CONNECTED)) {
        log.debug("Can't send while not connected");
        return;
      }
      if (message.type == "msg") {
        log.debug("Sending message to remote server: " + JSON.stringify(message));
        this.socket.write(message.value + "\r\n");
      }
    },

    _onError: function(err) {
      // assert this.status == CONNECTED
      log.error("Unexpected closure of remote server connection: " + err);
      this._onDisconnection();
    },

    _onConnection: function() {
      // assert this.status == CONNECTING
      log.info("Connected to remote server");
      this._clearTimeout();
      this._setStatus(CONNECTED);
    },

    _onDisconnection: function() {
      // assert this.status == CONNECTED || this.status == CONNECTING
      log.info("Disconnected from remote server")

      this._setStatus(DISCONNECTED);

      this.socket = null;
      if (this.nextTimeout === 0) {
        log.info("Retry connection");
        this.connect();
        this.nextTimeout = 10;
      } else {
        this._setStatus(PAUSED);
        var that = this;
        this.retrying = setTimeout(function() {
          log.info("Retry connection after timeout");
          that.connect();
        },this.nextTimeout);

        this.nextTimeout*=2;
      }

    },

    _onMessage: function(message) {
      // assert this.status == CONNECTED

      var that = this;
      this.emit("message",{
        type: "msg",
        sender: that.id,
        value: message
      });
    }

  };

  return Inheritance(RemoteServerClient, events.EventEmitter);

});
