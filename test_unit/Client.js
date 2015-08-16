var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require,
  baseUrl: process.cwd()
});

exports.shouldRespondToFinAndDisconnect = function(test){
  test.expect(2);

  requirejs(["./lib/Client","stream","./lib/util/CountDownLatch","through"],
    function(Client,stream,CountDownLatch,through) {

    var wait = new CountDownLatch(2,test);

    var fakeSocket = through(
      function write(data) {
        this.emit('data', data)
      },
      function end() { //optional
        test.ok(true);
        wait.countDown();
      });

    var client = new Client("test",fakeSocket);

    client.on("disconnected",function() {
      test.ok(true);
      wait.countDown();
    });

    fakeSocket.emit("end");

  });
};



exports.shouldCloseInError = function(test){
  test.expect(2);

  requirejs(["./lib/Client","stream","./lib/util/CountDownLatch","through"],
    function(Client,stream,CountDownLatch,through) {

    var wait = new CountDownLatch(2,test);

    var fakeSocket = through(
      function write(data) {
        this.emit('data', data)
      },
      function end() {
        test.ok(true);
        wait.countDown();
      });

    var client = new Client("test",fakeSocket);

    client.on("disconnected",function() {
      test.ok(true);
      wait.countDown();
    });

    fakeSocket.emit("error","error");

  });
};

exports.shouldEmitReceivedData = function(test){
  test.expect(1);

  requirejs(["./lib/Client","stream","through"],
    function(Client,stream,through) {

    var fakeSocket = through(
      function write(data) {
        this.emit('data', data)
      },
      function end() {
      });

    var client = new Client("test",fakeSocket);

    client.on("message",function(message) {
      test.equals("my-message",message);
      test.done();
    });

    fakeSocket.write("my-message\r\n");

  });
};

exports.shouldEmitASingleMessage = function(test){
  test.expect(1);

  requirejs(["./lib/Client","stream","through"],
    function(Client,stream,through) {

    var fakeSocket = through(
      function write(data) {
        this.emit('data', data)
      },
      function end() {
      });

    var client = new Client("test",fakeSocket);

    client.on("message",function(message) {
      test.equals("my-message",message);
    });

    fakeSocket.write("my-message\r\nwill-wait-end-line");

    setTimeout(function() {
      test.done();
    },100);

  });
};

exports.shouldEmitMessageLater = function(test){
  test.expect(2);

  requirejs(["./lib/Client","stream","through"],
    function(Client,stream,through) {

    var fakeSocket = through(
      function write(data) {
        this.emit('data', data)
      },
      function end() {
      });

    var client = new Client("test",fakeSocket);

    var isLater = false;
    client.on("message",function(message) {

      test.equals("my-message",message);
      test.equals(isLater,true);
      test.done();
    });

    fakeSocket.write("my-message");

    setTimeout(function() {
      isLater = true;
      fakeSocket.write("\r\n");
    },10);

  });
};

exports.shouldWriteToSocket = function(test){
  test.expect(1);

  requirejs(["./lib/Client","stream","through"],
    function(Client,stream,through) {

    var fakeSocket = through(
      function write(data) {
        test.equals("my-message",data);
        test.done();
      });

    var client = new Client("test",fakeSocket);

    client.on("message",function(message) {
      test.ok(false);
    });

    client.sendMessage("my-message");

  });
};

exports.shouldNotWriteToClosedSocket = function(test){
  test.expect(1);

  requirejs(["./lib/Client","stream","through"],
    function(Client,stream,through) {

    var fakeSocket = through(
      function write(data) {
        test.ok(false);
      },
      function end() {
      });

    var client = new Client("test",fakeSocket);

    client.on("message",function(message) {
      test.ok(false);
    });

    client.close();
    client.sendMessage("my-message");

    setTimeout(function() {
      test.ok(true);
      test.done();
    },100);
  });
};
