var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require,
  baseUrl: process.cwd()
});

function FakeServer(events,test,wait) {
  this.events = events;
  this.test = test;
  this.i = 0;
  this.wait = wait;
}
FakeServer.prototype = {
  send: function(msg) {
    this.test.deepEqual(this.events[this.i++],msg);
    if (this.wait) {
      this.wait.countDown();
    }
  },
  on:function(type,callback) {
    this.test.equals(type,"message");
    this.callback = callback;
  },
  emit: function(msg) {
    this.callback(msg);
  }
};

exports.shouldAcceptAndStartServer = function(test){
  test.expect(2);

  requirejs(["./lib/Router","./lib/util/CountDownLatch"],
    function(Router,CountDownLatch) {

    var wait = new CountDownLatch(1,test);
    var server = new FakeServer([{type:"start"}],test,wait);

    var router = new Router();
    router.start();
    router.add("test",server);
  });
};

exports.shouldAcceptButNotStartServer = function(test){
  test.expect(1);

  requirejs(["./lib/Router","./lib/util/CountDownLatch"],
    function(Router,CountDownLatch) {

      var wait = new CountDownLatch(1,test);
      var server = new FakeServer([],test,wait);

      var router = new Router();
      router.add("test",server);

      setTimeout(function() {
        test.done();
      },100);

    });

};


exports.shouldAcceptAndStartThenStopTheStartServers = function(test){
  test.expect(8);

  requirejs(["./lib/Router","./lib/util/CountDownLatch"],
    function(Router,CountDownLatch) {

    var expecting = [
      {type:"start"},
      {type:"stop"},
      {type:"start"}
    ];
    var wait = new CountDownLatch(6,test);
    var server1 = new FakeServer(expecting,test,wait);
    var server2 = new FakeServer(expecting,test,wait);

    var router = new Router();
    router.start();

    router.add("server1",server1);
    router.add("server2",server2);

    router.stop();
    router.start();
  });
};

exports.shouldSendMessageFromServer1ToServer2 = function(test){
  test.expect(5);

  requirejs(["./lib/Router","./lib/util/CountDownLatch"],
    function(Router,CountDownLatch) {

    var wait = new CountDownLatch(3,test);
    var server1 = new FakeServer([{type:"start"}],test,wait);
    var server2 = new FakeServer([
      {type:"start"},
      {type:"msg", sender: "ROUTER", value: "42"},
    ],test,wait);

    var router = new Router();
    router.start();

    router.add("server1",server1);
    router.add("server2",server2);

    server1.emit({type:"msg", sender: "server1", value: "42"});
  });
};

exports.shouldRefuseDuplicatedId = function(test){
  test.expect(1);

  requirejs(["./lib/Router","./lib/util/CountDownLatch"],
    function(Router,CountDownLatch) {

      var server1 = {send:function(){},on:function(){}};
      var server2 = {send:function(){},on:function(){}};

      var router = new Router();
      router.start();

      router.add("server1",server1);
      try {
        router.add("server1", server2);
        test.ok(false);
      } catch(e) {
        test.ok(true);

      }
      test.done();
    });
};
