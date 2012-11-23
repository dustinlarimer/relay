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
    , stream: req.stream
    , latest_update: moment(req.stream.date_updated).fromNow()
    //, posts: req.posts
  })
}

// Delete an article
exports.destroy = function(req, res){
  var stream = req.stream
  stream.remove(function(err){
    // req.flash('notice', 'Deleted successfully')
    res.redirect('/streams')
  })
}

// Listing of Articles
exports.index = function(req, res){
  var perPage = 5
    , page = req.param('page') > 0 ? req.param('page') : 0

  Stream
    .find({})
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