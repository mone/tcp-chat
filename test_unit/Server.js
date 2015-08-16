var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require,
  baseUrl: process.cwd()
});

var nextPort = 10000;

exports.shouldStartListen = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var server = new Server("test",nextPort++,true);
    server.start(net.createServer());

    server.on("listening",function() {
      test.ok(true);
      test.done();
    });


  });
};



exports.shouldStopListen = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var server = new Server("test",nextPort++,true);
    server.start(net.createServer());

    server.on("listening",function() {
      server.stop();
    });
    server.on("closed",function() {
      test.ok(true);
      test.done();
    });
  });
};

exports.shouldClose = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var server = new Server("test",nextPort++,true);
    var serverSocket = net.createServer();
    server.start(serverSocket);

    server.on("listening",function() {
      serverSocket.close();
    });
    server.on("closed",function() {
      test.ok(true);
      test.done();
    });
  });
};


exports.shouldAcceptClient = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var port = nextPort++;
    var server = new Server("test",port,true);
    var serverSocket = net.createServer();
    server.start(serverSocket);

    var socket = new net.Socket();
    socket.connect(port, "localhost");

    socket.on("connect",function() {
      test.ok(true);
      test.done();
    });
  });
};

exports.shouldAcceptClients = function(test){
  test.expect(2);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var wait = new CountDownLatch(2,test);

    var port = nextPort++;
    var server = new Server("test",port,true);
    var serverSocket = net.createServer();
    server.start(serverSocket);

    var socket = new net.Socket();
    socket.connect(port, "localhost");

    socket.on("connect",function() {
      test.ok(true);
      wait.countDown();
    });

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");

    socket2.on("connect",function() {
      test.ok(true);
      wait.countDown();
    });
  });
};

exports.shouldAcceptAndCloseClients = function(test){
  test.expect(2);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var wait = new CountDownLatch(2,test);
    var waitConn = new CountDownLatch(2,{
      done: function() {
        //clients are connected now, close server
        server.stop();
      }
    });

    var port = nextPort;
    var server = new Server("test",port,true);
    var serverSocket = net.createServer();
    server.start(serverSocket);

    var socket = new net.Socket();
    socket.connect(port, "localhost");

    socket.on("connect",function() {
      waitConn.countDown();
    });

    socket.on("close",function() {
      test.ok(true);
      wait.countDown();
    });

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");

    socket2.on("connect",function() {
      waitConn.countDown();
    });

    socket2.on("close",function() {
      test.ok(true);
      wait.countDown();
    });
  });
};
