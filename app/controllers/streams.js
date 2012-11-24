var mongoose = require('mongoose')
  , Stream = mongoose.model('Stream')
  , _ = require('underscore')
  , moment = require('moment')

// New stream
exports.new = function(req, res){
  res.render('streams/new', {
      title: 'New Stream'
    , stream: new Stream({})
  })
}

// Create a stream
exports.create = function (req, res) {
  var stream = new Stream(req.body)
  stream.members.push(req.user)
  stream.save(function(err){
    if (err) {
      res.render('streams/new', {
          title: 'New Stream'
        , stream: stream
        , errors: err.errors
      })
    }
    else {
      res.redirect('/streams/'+stream._id)
    }
  })
}

// Edit a stream
exports.edit = function (req, res) {
  res.render('streams/edit', {
    title: 'Edit '+req.stream.title,
    stream: req.stream
  })
}

// Update a stream
exports.update = function(req, res){
  var stream = req.stream
  stream = _.extend(stream, req.body)

  var now = new Date();
  var jsonDate = now.toJSON();
  stream.date_updated = jsonDate

  stream.save(function(err, doc) {
    if (err) {
      res.render('streams/edit', {
          title: 'Edit Stream'
        , stream: stream
        , errors: err.errors
      })
    }
    else {
      res.redirect('/streams/'+stream._id)
    }
  })
}

// View a stream
exports.show = function(req, res){
  res.render('streams/show', {
      title: req.stream.title
    , user: req.user
    , stream: req.stream
    , latest_update: moment(req.stream.date_updated).fromNow()
    //, posts: req.posts
  })
}

// Delete a stream
exports.destroy = function(req, res){
  var stream = req.stream
  stream.remove(function(err){
    // req.flash('notice', 'Deleted successfully')
    res.redirect('/streams')
  })
}

// Index of streams
exports.index = function(req, res){
  var perPage = 5
    , page = req.param('page') > 0 ? req.param('page') : 0

  Stream
    .find({ members : req.user })
    .populate('members', 'name')
    .sort({'date_created': -1}) // sort by date
    .limit(perPage)
    .skip(perPage * page)
    .exec(function(err, streams) {
      if (err) return res.render('500')
      Stream.count().exec(function (err, count) {
        res.render('streams/index', {
            title: 'List of Streams'
          , streams: streams
          , page: page
          , pages: count / perPage
        })
      })
    })
}

// Add user to stream as member
// Remove member from stream

/*
 * Get connected users at room

exports.getUsersInRoom = function(req, res, client, room, fn) {
  client.smembers('rooms:' + req.params.id + ':online', function(err, online_users) {
    var users = [];

    online_users.forEach(function(userKey, index) {
      client.get('users:' + userKey + ':status', function(err, status) {
        var msnData = userKey.split(':')
          , username = msnData.length > 1 ? msnData[1] : msnData[0]
          , provider = msnData.length > 1 ? msnData[0] : "twitter";

        users.push({
            username: username,
            provider: provider,
            status: status || 'available'
        });
      });
    });

    fn(users);

  });
};
 */

/*
 * Enter to a room

exports.enterRoom = function(req, res, room, users, rooms, status){
  res.locals({
    room: room,
    rooms: rooms,
    user: {
      nickname: req.user.username,
      provider: req.user.provider,
      status: status
    },
    users_list: users
  });
  res.render('room');
};
 */