define(["./log/LoggerManager","net","./Client","events","./util/Inheritance"],
  function(LoggerManager,net,Client,events,Inheritance) {


	var log = LoggerManager.getLoggerProxy("Server");

  function Server(id,port,echoToSender) {
    this.port = port;
    this.echoToSender = echoToSender;

    this.nextClientId = 0;
    this.clients = {};

    this.server = null;
    this.listening = false;

    this.processId = id;
  };


  Server.prototype = {

    start: function(serverSocket) {

      log.info(this.processId+"] Start listening to port "+this.port);

      var that = this;
      this.server = serverSocket;

      this.server.on("listening", function() {
        log.info(that.processId+"] Now Listening to port "+that.port);
        that.listening = true;
        that.emit("listening");
      });

      this.server.on("connection", function(socket) {
        //socket.setEncoding
        //socket.bufferSize
        //socket.setKeepAlive([enable][, initialDelay])#
        that._acceptClient(socket);
      });

      this.server.on("close", function() {
        log.info(that.processId+"] Server stopped");
        that.emit("closed");
      });

      this.server.on("error", function() {
        log.info(that.processId+"] Server stopped");
      });

      this.server.listen(this.port);
    },

    _acceptClient: function(socket) {
      var clientId = this.processId+"-"+this.nextClientId++;
      log.info(this.processId + "] Client connected from " + socket.remoteAddress+":"+socket.remotePort + " new client id is " + clientId);

      var newClient = new Client(clientId, socket);
      this.clients[clientId] = newClient;
    },

    stop: function() {
      this.server.close();
      for (var i in this.clients) {
        //pending socket must be explicitly close
        this.clients[i].close();
      }
    }


  }




  return Inheritance(Server, events.EventEmitter);
});
