
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
	  , name = hs.harbor.user.name
	  , provider = hs.harbor.user.provider
	  , userKey = provider + ":" + name
  	  , stream_id = hs.harbor.stream
	  , now = new Date()
	  /* Chat Log handler // (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) */
	  , chatlogFileName = './chats/' + stream_id + ".txt"
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
							current_stream.posts.push(my_post)
							current_stream.save(function(err){
								if (!err) {
									socket.emit('new msg', {
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
			io.sockets.emit('user-info update', {
				username: name,
				provider: provider,
				status: status
			});
		});
	});

	socket.on('history request', function() {
		history = []
		Post.find({ stream : stream_id })
			.exec(function(err, posts) {
				console.log("Found " + posts.length + " posts")
				
				async.forEach(posts, function (post, callback){
					User
						.findOne({ _id: post.owner })
						.exec(function(err, user){
							console.log("Loading a post for: " + user.name)
							history.push({
								  name: user.name
								, body: post.body
								, date: post.date_created
							})
							if (history.length == posts.length){
								console.log("Returning " + history.length + " posts")
								socket.emit('history response', {
									history: history
								});
							}
						})
					callback();
				});
				
			})
		
		/*
		Stream.findOne({_id: stream_id}, function(err, current_stream) {
		    console.log("--> Connected to: " + current_stream.title);
			var history = []
			
			Post
				.find({ stream : current_stream._id })
				//.sort({'date_created': -1})
				.exec(function(err, posts) {
					console.log("Found " + posts.length + " posts")
					
					async.forEach(posts, function (post, callback){
						User
							.findOne({ _id: post.owner })
							.exec(function(err, user){
								console.log("Loading a post for: " + user.name)
								history.push({
									  name: user.name
									, body: post.body
									, date: post.date_created
								})
							})
						callback();
					}, function(err) {
						console.log(history.length)
						console.log(posts.length)
						if (history.length == posts.length){
							console.log("History length: " + history.length)
							socket.emit('history response', {
								history: history
							});
						}
					});
					
					/*
					console.log(posts)
					socket.emit('history response', {
						history: posts
					});
					
					/*
					var total_results = posts.length
					var total_process = 0
					posts.forEach( function(post) {
						User
							.findOne({ _id: post.owner })
							.exec(function(err, user){
								console.log("Loading a post for: " + user.name)
								history.push({
									  name: user.name
									, body: post.body
									, date: post.date_created
								})
								console.log("History length: " + history.length)
							})
						total_process = total_process + 1
						if (total_process == total_results) {
							console.log("History length: " + history.length)
							socket.emit('history response', {
								history: history
							});
						}
					})*
				})*/
		
			
			/*async.forEach(current_stream.posts, function (post, callback){ 
				console.log(post.body)

			    callback();
			}, function(err) {
				socket.emit('history response', {
					history: history
				});
			});*
		});*/
		
		
		/*
		var history = [];
		var tail = require('child_process').spawn('tail', ['-n', 15, chatlogFileName]);
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
		});*/
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
									
									/* *** */
									console.log("**********")
									console.log("TODO: Replace chatlogWriteStream.destroySoon();")
									console.log("**********")
									/* *** */
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