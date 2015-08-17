define(["./log/LoggerManager","net","cluster","config","os","./Server"],
  function(LoggerManager,net,cluster,config,os,Server) {


  var log = LoggerManager.getLoggerProxy("ServerCluster");

  function ServerCluster() {
    if (cluster.isMaster) {
      this.forkProcesses();
      this.setupUpperLevelClient();

    } else {
      this.setupServer();
      this.setupCommunication();
    }

  }

  ServerCluster.prototype = {

    forkProcesses: function() {
      var forks = 1;
      if (config.has("localCluster") && config.get("localCluster.enabled")) {
        if (config.has("localCluster.forks")) {
          var forksSetting = config.get("localCluster.forks");
          if (isNaN(forksSetting)) {
            if (forksSetting === "auto") {
              forks = os.cpus().length;
            } else {
              log.fatal("invalid setting for the localCluster.forks value; revise the configuration file");
              throw "invalid setting for the localCluster.forks value; revise the configuration file";
            }
          } else {
            forks = Number(forks);
          }
        }
      }

      var that = this;
      for (var i = 0; i < forks; i++) {
        var fork = cluster.fork();

        fork.on("message",function(msg) {
          console.log("Received fork message: " + JSON.stringify(msg))
          if (log.isDebugLogEnabled()) {
            log.debug("Received fork message: " + JSON.stringify(msg));
          }
          if (msg.type === "lower-msg") {
            that.broadcastToOthers(msg.value,msg.sender);
          }
        })

      }
    },

    broadcastToOthers: function(message,sender) {
      for (var id in cluster.workers) {
        if (id == sender) {
          continue;
        }
        cluster.workers[id].send({
          value: message,
          type: "upper-msg"
        });
      }
    },

    setupServer: function() {
      if (!config.has("port") && !config.has("echoToSender")) {
        log.fatal("port and echoToSender are mandatory; revise the configuration file");
        throw "port and echoToSender are mandatory; revise the configuration file"
      }

      var port = config.get("port");
      if (isNaN(port) || port === null) {
        log.fatal("port must be a number (beware, lower ports might require root access)");
        throw "port must be a number (beware, lower ports might require root access)";
      }

      var echoToSender = config.get("echoToSender");
      if (echoToSender !== true && echoToSender!==false) {
        log.fatal("echoToSender must be a boolean");
        throw "echoToSender must be a boolean";
      }

      this.server = new Server(cluster.worker.id,Number(port),echoToSender);
      this.server.start(net.createServer());

      this.server.on("broadcast",function(data,sender) {
        if (sender == "MASTER") {
          return;
        }
        process.send({
          value: data,
          type: "lower-msg",
          sender: cluster.worker.id
        });
      });
    },


    setupCommunication: function() {
      var that = this;

      process.on("message", function(msg) {
        console.log("Received process message: " + JSON.stringify(msg))
        if (log.isDebugLogEnabled()) {
          log.debug("Received process message: " + JSON.stringify(msg));
        }
        if (msg.type === "upper-msg") {
          that.server.broadcastMessage(msg.value,"MASTER");

        } else if (msg.type == "stop") {
          that.server.stop();
        }
      });
    },


    setupUpperLevelClient: function() {
      if (config.has("cluster") && config.get("cluster.enabled")) {
        if (!config.has("cluster.upperLevelServer")) {
          log.fatal("missing cluster.upperLevelServer value; revise the configuration file");
          throw "missing cluster.upperLevelServer value; revise the configuration file";
        }
      }
    }


  };

  return ServerCluster;

});
