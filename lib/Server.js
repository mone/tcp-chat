define(["./log/LoggerManager","net","./Client","events","./util/Inheritance"],
  function(LoggerManager,net,Client,events,Inheritance) {


  var log = LoggerManager.getLoggerProxy("Server");

  function Server(id,port,echoToSender) {
    this.port = port;
    this.echoToSender = echoToSender;

    this.nextClientId = 0;
    this.clients = {};
    this.clientsCount = 0;

    this.server = null;

    this.processId = id;
  };


  Server.prototype = {

    start: function(serverSocket) {

      log.info(this.processId+"] Start listening to port "+this.port);

      var that = this;
      this.server = serverSocket;

      this.server.on("listening", function() {
        log.info(that.processId+"] Now Listening to port "+that.port);
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
        log.info(that.processId+"] Server error"); //a close will follow
      });

      this.server.listen(this.port);
    },

    _acceptClient: function(socket) {
      var clientId = this.processId+"-"+this.nextClientId++;
      log.info(this.processId + "] Client connected from " + socket.remoteAddress+":"+socket.remotePort + " new client id is " + clientId);

      var newClient = new Client(clientId, socket);
      this.clients[clientId] = newClient;
      this.clientsCount++;

      var that = this;
      newClient.on("disconnected",function() {
        delete(that.clients[clientId]);
        that.clientsCount--;
      });
      newClient.on("message",function(data) {
        that.broadcastMessage(data,clientId);
      })
    },

    stop: function() {
      log.info(this.processId + "] Closing server and open sockets");
      this.server.close();
      for (var i in this.clients) {
        //pending sockets must be explicitly close
        this.clients[i].close();
      }
    },

    getClientsCount: function() {
      return this.clientsCount;
    },

    broadcastMessage: function(data,sender) {
      log.info(this.processId + "] New message to be sent to clients: " + data);

      if (this.echoToSender || !sender) {
        for (var i in this.clients) {
          this.clients[i].sendMessage(data+"\r\n");
        }
      } else {
        for (var i in this.clients) {
          if (i == sender) {
            continue;
          }
          this.clients[i].sendMessage(data+"\r\n");
        }
      }

      this.emit("broadcast", data, sender); //notify local listeners
    }

  };




  return Inheritance(Server, events.EventEmitter);
});
