#tcp-chat

##Install

`npm install`

##Configure

`vi config/default.js`

## Run

###Standard
There are a few ready made configuration, the default one (config/default.js) will launch a process that will fork a process per each cpu

`node server.js`

###Simple
The config/single.json one will launch a server that uses one core only

`export NODE_ENV=single`
`node server.js`

###Cluster
Then there are the configuration files to setup a cluster of servers. Let's say there are too many clients for one single server to handle; what you do is start
a server with the cluster.json configuration, this server will stay at an higher level and will server lower-level servers

`export NODE_ENV=cluster`
`node server.js`

and then start the two servers to serve the clients using clusternode.json and clusternode2.json

`export NODE_ENV=clusternode`
`node server.js`

`export NODE_ENV=clusternode2`
`node server.js`


The configuration files as given are made to run on a single machine, obviously the point of the cluster is to run each process on a different machine (cluster
might stay on one of the other machines together with a cluster-node). Also, if the upper level server falls, the lower levels stop working too until the higher
one is back online. It is possible to configure the servers to ignore the lost connection with the higher level server.

Note that this can be repeated, if the servers connected to the cluster server are too many, simply setup an higher-level cluster server and connect the previous level 
to this new one adding a new machine for that level.

## Test

`node run_tests.js` will execute all the tests in the test folder; run it with the `-nodemon` flag to run the tests every time a change is made.
