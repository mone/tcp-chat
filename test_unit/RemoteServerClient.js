var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require,
  baseUrl: process.cwd()
});
var port = 30000;
exports.client = {
  setUp: function (callback) {
    var that = this;
    requirejs(["./lib/Server"], function(Server) {
      that.port = port++;
      that.server = new Server("RemoteServer",that.port,true);
      that.server.once("listening",callback);
      that.server.start();
    });
  },
  tearDown: function (callback) {
    if (!this.server.running) {
      callback();
    } else {
      this.server.once("closed",callback);
      this.server.stop();
    }
  },
  shouldConnectAndDisconnect: function (test) {
    test.expect(3);
    var that = this;

    requirejs(["./lib/RemoteServerClient"],
      function(RemoteServerClient) {

      var client = new RemoteServerClient("test_shouldConnectAndDisconnect","localhost",that.port);

      var eventCount = 0;
      client.on("connecting",function() {
        eventCount++;
        test.equals(1,eventCount);
      });
      client.on("connected",function() {
        eventCount++;
        test.equals(2,eventCount);
        client.disconnect();
      });
      client.on("disconnected",function() {
        eventCount++;
        test.equals(3,eventCount);
        setTimeout(function() {
          test.done();
        },10);
      });


      client.connect();

    });
  },

  shouldSendMessageAndReceiveItsEcho: function (test) {
    test.expect(4);
    var that = this;

    requirejs(["./lib/RemoteServerClient"],
      function(RemoteServerClient) {

      var client = new RemoteServerClient("test_shouldSendMessageAndReceiveItsEcho","localhost",that.port);

      var eventCount = 0;
      client.on("connecting",function() {
        eventCount++;
        test.equals(1,eventCount);
      });
      client.on("connected",function() {
        eventCount++;
        test.equals(2,eventCount);
        client.send({
          type: "msg",
          sender: "someone",
          value: "test-message"
        });
      });
      client.on("message",function(message) {
        eventCount++;
        test.equals(3,eventCount);
        test.deepEqual({
          type: "msg",
          sender: "test_shouldSendMessageAndReceiveItsEcho",
          value: "test-message"
        },message);

        client.disconnect();
        test.done();
      });


      client.connect();

    });
  },

  shouldReconnect: function(test) {
    test.expect(4);
    var that = this;

    requirejs(["./lib/RemoteServerClient"],
      function (RemoteServerClient) {

      var client = new RemoteServerClient("test_shouldReconnect", "localhost", that.port);

      var eventCount = 0;
      var round = 0;
      client.on("connecting", function () {
        if (round == 0) {
          eventCount++;
          test.equals(1, eventCount);
        } else {
          //might happen multiple times
        }
      });
      client.on("connected", function () {
        eventCount++;
        if (round == 0) {
          test.equals(2, eventCount);
          that.server.stop();
        } else {
          test.equals(4, eventCount);
          client.disconnect();
          test.done();
        }
      });
      client.on("disconnected", function () {
        eventCount++;
        if (round == 0) {
          test.equals(3, eventCount);
          that.server.start();
          round = 1;
        } else {
          //might happen multiple times
        }
      });


      client.connect();

    });
  },

  shouldReconnectAFewTimes: function(test) {
    test.expect(9);
    var that = this;

    requirejs(["./lib/RemoteServerClient"],
    function(RemoteServerClient) {

      that.server.stop();

      var client = new RemoteServerClient("test_shouldReconnectAFewTimes","localhost",that.port);

      var prev = "disconnected";
      var connectingCount = 0;

      client.on("connecting",function() {
        if (connectingCount < 2) {
          test.equals(prev, "disconnected",connectingCount);
        } else {
          test.equals(prev, "paused",connectingCount);
        }
        prev = "connecting";
        connectingCount++;
        if (connectingCount == 4) {
          client.disconnect();
          test.done();
        }
      });
      client.on("connected",function() {
        test.ok(false);
        prev = "connected";
      });
      client.on("disconnected",function() {
        test.equals(prev,"connecting");
        prev = "disconnected";
      });
      client.on("paused",function() {
        test.equals(prev,"disconnected");
        prev = "paused";
      });


      client.connect();

    });
  }
};
