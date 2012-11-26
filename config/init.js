
/*
 * Module dependencies
 */

module.exports = function(client){

  /*
   * Clean all forgoten sockets in Redis.io
   */

  // Delete all users sockets from their lists
  client.keys('sockets:for:*', function(err, keys) {
    if(keys.length) client.del(keys);
    console.log('Deletion of sockets reference for each user >> ', err || "Done!");
  });

  // No one is online when starting up
  client.keys('streams:*:online', function(err, keys) {
    var streamNames = [];
    
    if(keys.length) {
      streamNames = streamNames.concat(keys);
      client.del(keys);
    }

    streamNames.forEach(function(streamName, index) {
      var key = streamName.replace(':online', ':info');
      client.hset(key, 'online', 0);
    });

    console.log('Deletion of online users from streams >> ', err || "Done!");
  });

  // Delete all socket.io's sockets data from Redis
  client.smembers('socketio:sockets', function(err, sockets) {
    if(sockets.length) client.del(sockets);
    console.log('Deletion of socket.io stored sockets data >> ', err || "Done!");
  });

};

