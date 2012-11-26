
/*
* Module dependencies
*/

var parent = module.parent.exports 
  , app = parent.app
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config')[env]
  , server = parent.server
  , express = require('express')
  , client = parent.client
  , sessionStore = parent.sessionStore
  , sio = require('socket.io')
  , parseCookies = require('connect').utils.parseSignedCookies
  , cookie = require('cookie')
  , fs = require('fs')
  , async = require('async')

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Stream = mongoose.model('Stream')
  , Post = mongoose.model('Post')

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

var notifications = io.of('/notifications').on('connection', function (socket) {})

var chat = io.of('/chat').on('connection', function (socket) {
	var hs = socket.handshake
	  , name = hs.harbor.user
	  , provider = hs.harbor.user.provider
	  , userKey = name // provider + ":" + name
  	  , stream_id = hs.harbor.stream
	  , now = new Date()
	  /* Chat Log handler // (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) */
	  , chatlogFileName = './chats/' + stream_id + ".txt"
	  , chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});

	socket.join(stream_id);

	client.sadd('sockets:for:' + userKey + ':at:' + stream_id, socket.id, function(err, socketAdded) {
		if(socketAdded) {
			client.sadd('socketio:sockets', socket.id);
			User.findOne({_id: userKey}, function(err, current_user){
				client.sadd('streams:' + stream_id + ':online', current_user, function(err, userAdded) {
					if(userAdded) {
						client.hincrby('streams:' + stream_id + ':info', 'online', 1);
						client.get('users:' + current_user + ':status', function(err, status) {
							io.of('/chat').in(stream_id).emit('new user', {
								name: current_user.name,
								provider: current_user.provider,
								status: status || 'available'
							});
						});
					}
				});
			})
		}
	});
	socket.on('disconnect', function() {
		client.srem('sockets:for:' + userKey + ':at:' + stream_id, socket.id, function(err, removed) {
			if(removed) {
				client.srem('socketio:sockets', socket.id);
				client.scard('sockets:for:' + userKey + ':at:' + stream_id, function(err, members_no) {
					if(!members_no) {
						User.findOne({_id: userKey}, function(err, current_user){
							console.log(current_user.name + ' is about to leave...')
							client.srem('streams:' + stream_id + ':online', current_user, function(err, user) {
								console.log(user)
								if (!user) {
									console.log(current_user.name + ' has left the building')
									client.hincrby('streams:' + stream_id + ':info', 'online', -1);
									io.of('/chat').in(stream_id).emit('user leave', {
										name: current_user.name,
										provider: current_user.provider
									});
								}
							});
						})
					}
				});
			}
		});
	});

	socket.on('my msg', function(data) {
		var no_empty = data.msg.replace("\n","");
		if(no_empty.length > 0) {
			Stream.findOne({_id: stream_id}, function(err, current_stream) {
			    console.log("--> Connected to: " + current_stream.title);
				posts = current_stream.posts
				User.findOne({_id: hs.harbor.user}, function(err, current_user){
					var my_post = new Post({
						  stream: current_stream._id
						, body: data.msg
						, owner: current_user
					})
					console.log("Saving new post for " + current_user.name)
					my_post.save(function(err){
						if (!err) {
							var now = new Date();
							var jsonDate = now.toJSON();
							current_stream.date_updated = jsonDate
							current_stream.posts.push(my_post)
							current_stream.save(function(err){
								if (!err) {
									io.of('/chat').in(stream_id).emit('new msg', {
										  name: my_post.owner.name
										, provider: my_post.owner.provider
										, msg: my_post.body
									});
								} else {
									// emit: Stream not saved
								}
							})
						}
						else {
							// emit: Post not saved
						}
					})	
				})
			});
		}  
	});

	socket.on('set status', function(data) {
		var status = data.status;
		client.set('users:' + userKey + ':status', status, function(err, statusSet) {
			io.of('/chat').in(stream_id).emit('user-info update', {
				username: name,
				provider: provider,
				status: status
			});
		});
	});

	socket.on('history request', function() {
		history = []
		Post
			.find({ stream : stream_id })
			.populate('owner', 'name')
			.exec(function(err, posts) {
				console.log("Found " + posts.length + " posts")
				async.map(posts, function(item, callback){
					//console.log(item)
					history.push({
						  name: item.owner.name
						, body: item.body
						, date: item.date_created
					})
					callback();
				}, function(err, results){
					//console.log("Returning " + history.length + " posts")
					io.of('/chat').in(stream_id).emit('history response', {
						history: history
					});
				});
			})
	});
});