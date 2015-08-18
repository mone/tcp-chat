var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});

requirejs(["config","./lib/log/LoggerManager","./lib/log/log4node/LoggerProvider"],
  function(config,LoggerManager,LoggerProvider) {

    var log4node = require('log4node');
    var log = new log4node.Log4Node({level: config.get("logLevel"), file: config.get("logFile")});

    var lp = new LoggerProvider(log);

    LoggerManager.setLoggerProvider(lp);
  });


requirejs(["config","os","cluster","./lib/Router","./lib/Server","./lib/Constants","./lib/RemoteServerClient"],
  function(config,os,cluster,Router,Server,Constants,RemoteServerClient) {

    //localCluster
    var localCluster = false;
    var forks = 0;
    if (config.has("localCluster") && config.get("localCluster.enabled")) {
      localCluster = true;
      var cpus = os.cpus().length;
      if (config.has("localCluster.forks")) {
        forks = config.get("localCluster.forks");
        if (forks === "auto") {
          forks = cpus;
        } else if (isNaN(forks)) {
          throw "invalid setting for the localCluster.forks value; revise the configuration file";
        } else {
          forsk = Number(forks);
        }
      } else {
        forks = cpus;
      }
    }

    //cluster
    var remoteEnabled = false;
    var permissivePolicy = false;
    var remoteServerHost = null;
    var remoteServerPort = null;
    if (config.has("cluster") && config.get("cluster.enabled")) {
      remoteEnabled = true;
      remoteServerHost = config.get("cluster.upperLevelServerHost");
      remoteServerPort = config.get("cluster.upperLevelServerPort");
      var policy = config.get("cluster.disconnectionPolicy");
      if (policy === "go-on") {
        permissivePolicy = true;
      } else if (policy === "stop") {
        permissivePolicy = false;
      } else {
        throw "invalid setting for the cluster.disconnectionPolicy value; revise the configuration file";
      }
    }

    //main
    var port = config.get("port");
    var echoToSender = config.get("echoToSender");


    //run
    if (cluster.isMaster && localCluster) {

      var main = new Router();

      function doFork() {
        var fork = cluster.fork();
        fork.once("message", function () {
          main.add(Constants.FORK_PREFIX + fork.id, fork);
        });
      }

      for (var i = 0; i < forks; i++) {
        doFork();
      }

      if (!remoteEnabled || permissivePolicy) {
        main.start();
      }

      if (remoteEnabled) {
        var bridge = new RemoteServerClient(Constants.UPPER_SERVER_ID, remoteServerHost, remoteServerPort);
        if (!permissivePolicy) {
          bridge.on("connected", function () {
            main.start();
          });
          bridge.on("disconnected", function () {
            main.stop();
          });
        }
        main.add(Constants.UPPER_SERVER_ID, bridge);
        bridge.connect();
      }


    } else if (cluster.isMaster) {

      var server = new Server("SINGLE",port,echoToSender);
      server.start();

    } else {
      var forkId = Constants.FORK_PREFIX+cluster.worker.id;
      var server = new Server(forkId,port,echoToSender);

      process.on("message",function(obj) {
        if (obj.type == "msg") {
          if (obj.sender == Constants.ROUTER_ID) {
            server.broadcastMessage(obj.value,obj.sender);
          }
        } else if (obj.type == "start") {
          server.start();
        } else if (obj.type == "stop") {
          server.stop();
        }

      });

      server.on("broadcast",function(message,sender) {
        if (sender != Constants.ROUTER_ID) {
          process.send({
            value: message,
            type: "msg",
            sender: forkId
          });
        }
      });

      process.send("ready");
    }

});
