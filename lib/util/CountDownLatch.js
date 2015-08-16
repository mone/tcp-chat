define(function() {

  function CountDownLatch(count,test) {
    this.count = count;
    this.test = test;
  };

  CountDownLatch.prototype = {
    countDown: function() {
      this.count--;
      if (this.count === 0) {
        this.test.done();
      }
      return this.count;
    }
  };

  return CountDownLatch;
})
