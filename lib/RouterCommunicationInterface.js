define(function() {

  function RouterCommunicationInterface(){};

  RouterCommunicationInterface.prototype = {

    send: function(obj) {
    },

    /*
     * emits "message"
     * the value given to the callback as parameter is a JSON-like object
     */
    on: function(event,callback){}

  };

  return RouterCommunicationInterface;

});
