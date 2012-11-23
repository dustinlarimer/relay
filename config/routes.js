var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Stream = mongoose.model('Stream')
  , async = require('async')

module.exports = function (app, passport, auth) {

  // User routes
  var users = require('../app/controllers/users')
  app.get('/login', users.login)
  app.get('/signup', users.signup)
  app.get('/logout', users.logout)
  app.post('/users', users.create)
  app.post('/users/session', passport.authenticate('local', {failureRedirect: '/login'}), users.session)
  app.get('/users/:userId', users.show)
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: [ 'email', 'user_about_me'], failureRedirect: '/login' }), users.signin)
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), users.authCallback)
  app.get('/auth/github', passport.authenticate('github', { failureRedirect: '/login' }), users.signin)
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), users.authCallback)
  app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/login' }), users.signin)
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), users.authCallback)
  app.get('/auth/google', passport.authenticate('google', { failureRedirect: '/login', scope: 'https://www.google.com/m8/feeds' }), users.signin)
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login', scope: 'https://www.google.com/m8/feeds' }), users.authCallback)

  app.param('userId', function (req, res, next, id) {
    User
      .findOne({ _id : id })
      .exec(function (err, user) {
        if (err) return next(err)
        if (!user) return next(new Error('Failed to load User ' + id))
        req.profile = user
        next()
      })
  })

  // Stream routes
  var streams = require('../app/controllers/streams')
  app.get('/streams', streams.index)
  app.get('/streams/new', auth.requiresLogin, streams.new)
  app.post('/streams', auth.requiresLogin, streams.create)
  app.get('/streams/:streamId', auth.requiresLogin, auth.stream.hasAuthorization, streams.show)
  app.get('/streams/:streamId/edit', auth.requiresLogin, auth.stream.hasAuthorization, streams.edit)
  app.put('/streams/:streamId', auth.requiresLogin, auth.stream.hasAuthorization, streams.update)
  app.del('/streams/:streamId', auth.requiresLogin, auth.stream.hasAuthorization, streams.destroy)

  app.param('streamId', function(req, res, next, id){
    Stream
      .findOne({ _id : id })
      .populate('members', 'name')
      .populate('posts')
      .exec(function (err, stream) {
        if (err) return next(err)
        if (!stream) return next(new Error('Failed to load stream ' + id))
        req.stream = stream
		next()
		
        /*var populatePosts = function (comment, cb) {
          User
            .findOne({ _id: comment._user })
            .select('name')
            .exec(function (err, user) {
              if (err) return next(err)
              comment.user = user
              cb(null, comment)
            })
        }

        if (stream.comments.length) {
          async.map(req.stream.comments, populateComments, function (err, results) {
            next(err)
          })
        }
        else
          next()*/

        
      })
  })

  // Home route
  app.get('/', users.index)
}