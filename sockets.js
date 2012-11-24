
/*
 * Module dependencies
 */

var parent = module.parent.exports 
  , app = parent.app
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , server = parent.server
  , express = require('express')
  , client = parent.client
  , sessionStore = parent.sessionStore
  , sio = require('socket.io')
  , parseCookies = require('connect').utils.parseSignedCookies
  , cookie = require('cookie')
  , fs = require('fs')

var io = sio.listen(server);

io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret)
      , sid = cookies['harbor'];

    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session', false);
      }

      hsData.harbor = {
        user: session.passport.user,
        stream: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
      };

      return accept(null, true);
      
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

io.configure(function() {
  io.set('store', new sio.RedisStore({client: client}));
  io.enable('browser client minification');
  io.enable('browser client gzip');
});

io.sockets.on('connection', function (socket) {
  var hs = socket.handshake
    , name = hs.harbor.user.name
    , provider = hs.harbor.user.provider
    , userKey = provider + ":" + name
    , stream_id = hs.harbor.stream
    , now = new Date()
    /* Chat Log handler */
    , chatlogFileName = './chats/' + stream_id + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt"
    , chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});
	
  socket.join(stream_id);

  client.sadd('sockets:for:' + userKey + ':at:' + stream_id, socket.id, function(err, socketAdded) {
    if(socketAdded) {
      client.sadd('socketio:sockets', socket.id);
      client.sadd('streams:' + stream_id + ':online', userKey, function(err, userAdded) {
        if(userAdded) {
          client.hincrby('streams:' + stream_id + ':info', 'online', 1);
          client.get('users:' + userKey + ':status', function(err, status) {
            io.sockets.in(stream_id).emit('new user', {
              name: name,
              provider: provider,
              status: status || 'available'
            });
          });
        }
      });
    }
  });

  socket.on('my msg', function(data) {
    var no_empty = data.msg.replace("\n","");
    if(no_empty.length > 0) {
      var chatlogRegistry = {
        type: 'message',
        from: userKey,
        atTime: new Date(),
        withData: data.msg
      }

      chatlogWriteStream.write(JSON.stringify(chatlogRegistry) + "\n");
      
      io.sockets.in(stream_id).emit('new msg', {
        name: name,
        provider: provider,
        msg: data.msg
      });        
    }   
  });

  socket.on('set status', function(data) {
    var status = data.status;

    client.set('users:' + userKey + ':status', status, function(err, statusSet) {
      io.sockets.emit('user-info update', {
        username: name,
        provider: provider,
        status: status
      });
    });
  });

  socket.on('history request', function() {
    var history = [];
    // TODO: Read back stream's post history
	console.log("Gimme my history!")
	/**/
	var tail = require('child_process').spawn('tail', ['-n', 5, chatlogFileName]);
    tail.stdout.on('data', function (data) {
      var lines = data.toString('utf-8').split("\n");
      
      lines.forEach(function(line, index) {
        if(line.length) {
          var historyLine = JSON.parse(line);
          history.push(historyLine);
        }
      });

      socket.emit('history response', {
        history: history
      });
    });
  });

  socket.on('disconnect', function() {
    // 'sockets:at:' + stream_id + ':for:' + userKey
    client.srem('sockets:for:' + userKey + ':at:' + stream_id, socket.id, function(err, removed) {
      if(removed) {
        client.srem('socketio:sockets', socket.id);
        client.scard('sockets:for:' + userKey + ':at:' + stream_id, function(err, members_no) {
          if(!members_no) {
            client.srem('streams:' + stream_id + ':online', userKey, function(err, removed) {
              if (removed) {
                client.hincrby('streams:' + stream_id + ':info', 'online', -1);
                chatlogWriteStream.destroySoon();
                io.sockets.in(stream_id).emit('user leave', {
                  name: name,
                  provider: provider
                });
              }
            });
          }
        });
      }
    });
  });
});

