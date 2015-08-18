define(["./log/LoggerManager","./Constants"],function(LoggerManager,Constants) {


  var log = LoggerManager.getLoggerProxy("Router");

  function Router() {
    this.servers = {};
  };

  Router.prototype = {

    /**
     * server must implement RouterCommunicationInterface
     */
    add: function(id,server) {
      if (this.servers[id]) {
        log.error("id already exists");
        throw "id already exists";
      }
      this.servers[id] = server;

      log.info("New element added: " + id);

      var that = this;
      server.on("message",function(msg) {
        if (log.isDebugLogEnabled()) {
          log.debug("New message from " + id + ": " + JSON.stringify(msg));
        }
        if (msg.type == "msg") {
          that._onMessage(msg.value,id); //id == msg.sender
        }
      });

      if (this.running) {
        log.info("Send start message to: " + id);
        server.send({type: "start"});
      }
    },

    _onMessage:function(message,sender) {
      var obj = {
        type: "msg",
        value: message,
        sender: Constants.ROUTER_ID
      };
      for (var i in this.servers) {
        if (i !== sender) {
          this._sendToServer(i,obj);
        }
      }
    },

    _sendToServer: function(server,obj) {
      if (log.isDebugLogEnabled()) {
        log.debug("Send message to " + server + ": " + JSON.stringify(obj));
      }
      this.servers[server].send(obj);
    },

    stop: function() {
      if (!this.running) {
        log.debug("Already stopped, ignore stop call");
        return;
      }
      this.running = false;

      log.info("Router stop");

      for (var i in this.servers) {
        if (log.isDebugLogEnabled()) {
          log.debug("Send stop message to " + i);
        }
        this.servers[i].send({type: "stop"});
      }
    },

    start: function() {
      if (this.running) {
        log.debug("Already running, ignore start call");
        return;
      }
      this.running = true;

      log.info("Router start");

      for (var i in this.servers) {
        if (log.isDebugLogEnabled()) {
          log.debug("Send start message to " + i);
        }
        this.servers[i].send({type: "start"});
      }
    }



  };

  return Router;





});
