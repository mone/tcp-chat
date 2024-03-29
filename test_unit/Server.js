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

    var server = new Server("test_shouldStartListen",nextPort++,true);
    server.start();

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

    var server = new Server("test_shouldStopListen",nextPort++,true);
    server.start();

    server.on("listening",function() {
      server.stop();
    });
    server.on("closed",function() {
      test.ok(true);
      test.done();
    });
  });
};

exports.shouldRecoverUnexpectedClose = function(test){
  test.expect(2);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var server = new Server("test_shouldRecoverUnexpectedClose",nextPort++,true);
    server.start();

    var listenEventsCount = 0;

    server.on("listening",function() {
      listenEventsCount++;
      if (listenEventsCount == 1) {
        //the server is now listening for the first time, let's close its socket
        server.getCurrentServerSocket().close();
      } else if (listenEventsCount == 2) {
        //it recovered succesfully, let's close for real
        server.stop();
      } else {
        test.ok(false);
      }

    });
    server.on("closed",function(recovering) {
      if (listenEventsCount == 1) {
        test.ok(recovering);
      } else if (listenEventsCount == 2) {
        test.ok(true);
        test.done();
      } else {
        test.ok(false);
      }

    });
  });
};


exports.shouldAcceptClient = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var port = nextPort++;
    var server = new Server("test_shouldAcceptClient",port,true);
    server.start();

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
    var server = new Server("test_shouldAcceptClients",port,true);
    server.start();

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

    var port = nextPort++;
    var server = new Server("test_shouldAcceptAndCloseClients",port,true);
    server.start();


    var wait = new CountDownLatch(2,{done:function(){
      test.equals(0,server.getClientsCount());
      test.done();
    }});
    var waitConn = new CountDownLatch(2,{
      done: function() {
        test.equals(2,server.getClientsCount());
        //clients are connected now, close server
        server.stop();
      }
    });


    function onConnect() {
      //it looks like that the connect event can be fired before the related connection event on the server socket
      //delay the call
      setTimeout(function() {
        waitConn.countDown();
      },10);
    }
    function onClose() {
      wait.countDown();
    }

    var socket = new net.Socket();
    socket.connect(port, "localhost");
    socket.on("connect",onConnect);
    socket.on("close",onClose);

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");
    socket2.on("connect",onConnect);
    socket2.on("close",onClose);
  });
};

exports.shouldBroadcastToClients = function(test){
  test.expect(2);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var port = nextPort++;
    var server = new Server("test_shouldBroadcastToClients",port,true);
    server.start();


    var wait = new CountDownLatch(2,test);
    var waitConn = new CountDownLatch(2,{
      done: function() {
        //clients are connected now, broadcast a message
        server.broadcastMessage("my-message");
      }
    });

    function onConnect() {
      setTimeout(function() {
        waitConn.countDown();
      },10);
    }
    function onData(data) {
      test.equals(data,"my-message\r\n");
      wait.countDown();
    }

    var socket = new net.Socket();
    socket.connect(port, "localhost");
    socket.on("connect",onConnect);
    socket.on("data",onData);

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");
    socket2.on("connect",onConnect);
    socket2.on("data",onData);
  });
};


exports.shouldBroadcastToClientsAndAlsoEmitTheEvent = function(test){
  test.expect(3);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var port = nextPort++;
    var server = new Server("test_shouldBroadcastToClientsAndAlsoEmitTheEvent",port,true);
    server.start();


    var wait = new CountDownLatch(3,test);
    var waitConn = new CountDownLatch(2,{
      done: function() {
        //clients are connected now, broadcast a message
        server.broadcastMessage("my-message");
      }
    });

    function onConnect() {
      setTimeout(function() {
        waitConn.countDown();
      },10);
    }
    function onData(data) {
      test.equals(data,"my-message\r\n");
      wait.countDown();
    }

    var socket = new net.Socket();
    socket.connect(port, "localhost");
    socket.on("connect",onConnect);
    socket.on("data",onData);

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");
    socket2.on("connect",onConnect);
    socket2.on("data",onData);

    server.on("broadcast",function(data) {
      test.equals(data,"my-message");
      wait.countDown();
    });
  });
};

exports.shouldBroadcastToClientsSurrogatePairs = function(test){
  test.expect(2);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var port = nextPort++;
    var server = new Server("test_shouldBroadcastToClientsSurrogatePairs",port,true);
    server.start();


    var wait = new CountDownLatch(2,test);
    var waitConn = new CountDownLatch(2,{
      done: function() {
        //clients are connected now, broadcast a message
        server.broadcastMessage("☢42☢my-message");
      }
    });

    function onConnect() {
      setTimeout(function() {
        waitConn.countDown();
      },10);
    }
    function onData(data) {
      test.equals(data,"☢42☢my-message\r\n");
      wait.countDown();
    }

    var socket = new net.Socket();
    socket.connect(port, "localhost");
    socket.on("connect",onConnect);
    socket.on("data",onData);

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");
    socket2.on("connect",onConnect);
    socket2.on("data",onData);
  });
};

exports.shouldBroadcastToClientsAfterReceivingFromClient = function(test){
  test.expect(2);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var port = nextPort++;
    var server = new Server("test_shouldBroadcastToClientsAfterReceivingFromClient",port,true);
    server.start();


    var wait = new CountDownLatch(2,test);
    var waitConn = new CountDownLatch(2,{
      done: function() {
        //clients are connected now, broadcast a message
        socket.write("client-message\r\n");
      }
    });

    function onConnect() {
      waitConn.countDown();
    }
    function onData(data) {
      test.equals(data,"client-message\r\n");
      wait.countDown();
    }

    var socket = new net.Socket();
    socket.connect(port, "localhost");
    socket.on("connect",onConnect);
    socket.on("data",onData);

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");
    socket2.on("connect",onConnect);
    socket2.on("data",onData);
  });
};

exports.shouldBroadcastToClientsAfterReceivingFromClientAvoidingSenderClient = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net","./lib/util/CountDownLatch"],
    function(Server,net,CountDownLatch) {

    var port = nextPort++;
    var server = new Server("test_shouldBroadcastToClientsAfterReceivingFromClientAvoidingSenderClient",port,false);
    server.start();

    var waitConn = new CountDownLatch(2,{
      done: function() {
        //clients are connected now, broadcast a message
        socket.write("client-message\r\n");
      }
    });

    function onConnect() {
      waitConn.countDown();
    }

    var socket = new net.Socket();
    socket.connect(port, "localhost");
    socket.on("connect",onConnect);
    socket.on("data",function(data) {
      test.ok(false);
      test.done();
    });

    var socket2 = new net.Socket();
    socket2.connect(port, "localhost");
    socket2.on("connect",onConnect);
    socket2.on("data", function(data) {
      test.equals(data,"client-message\r\n");
      setTimeout(function() {
        test.done();
      },100);
    });
  });
};

