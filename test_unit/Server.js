var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require,
  baseUrl: process.cwd()
});


exports.shouldStartListen = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var server = new Server("test",10000,true);
    server.start(net.createServer());

    server.on("listening",function() {
      test.ok(true);
      test.done();
    });

    //this test does not close the port, use a different port on other tests
  });
};



exports.shouldStopListen = function(test){
  test.expect(1);

  requirejs(["./lib/Server","net"],
    function(Server,net) {

    var server = new Server("test",10001,true);
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

    var server = new Server("test",10001,true);
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
