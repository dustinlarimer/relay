/* Main application entry file. Please note, the order of loading is important.
 * Configuration loading and booting of controllers and custom error handlers */

var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , passport = require('passport')
  , redis = require('redis')
  , redisStore = require('connect-redis')(express)
  , sio = require('socket.io')
  , parseCookies = require('connect').utils.parseSignedCookies
  , cookie = require('cookie')
  , init = require('./config/init')
  //, sessionStore;

require('express-namespace')

////////////////////////////////////////////////
// Configurations
////////////////////////////////////////////////
var env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , auth = require('./authorization')


////////////////////////////////////////////////
// Redis Configuration
////////////////////////////////////////////////
if (process.env.REDISTOGO_URL) {
  var rtg   = require('url').parse(process.env.REDISTOGO_URL);
  var client = exports.client  = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]); // auth 1st part is username and 2nd is password separated by ":"
} else {
  var client = exports.client  = redis.createClient();
}
var sessionStore = exports.sessionStore = new redisStore({client: client, host: config.session.host});
init(client);

////////////////////////////////////////////////
// MongoDB Configuration
////////////////////////////////////////////////
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
mongoose.connect(config.db.host)


////////////////////////////////////////////////
// Models
////////////////////////////////////////////////
var models_path = __dirname + '/app/models'
  , model_files = fs.readdirSync(models_path)
model_files.forEach(function (file) {
  require(models_path+'/'+file)
})


////////////////////////////////////////////////
// Passport Configuration
////////////////////////////////////////////////
require('./config/passport').boot(passport, config)


////////////////////////////////////////////////
// Express Configuration -> settings.js
////////////////////////////////////////////////
var app = express()                                       // express app
require('./settings').boot(app, config, passport)         // Bootstrap application settings


////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////
require('./config/routes')(app, passport, auth)


////////////////////////////////////////////////
// Start the App on <port> along with Socket.io
////////////////////////////////////////////////
var port = process.env.PORT || 3000
var server = exports.server = http.createServer(app).listen(port, function() {
  console.log('Express app started on port ' + port)
});


////////////////////////////////////////////////
// Socket.io Global Configuration
////////////////////////////////////////////////
//var io = exports.io = sio.listen(server);
require('./config/sockets')//(io);
