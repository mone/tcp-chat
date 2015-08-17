//setup requirejs: this application uses AMD modules
var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});

requirejs(["./lib/ServerCluster"],
  function(ServerCluster) {
    new ServerCluster();
});
