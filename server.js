/* Main application entry file. Please note, the order of loading is important.
 * Configuration loading and booting of controllers and custom error handlers */

var express = require('express')
  , fs = require('fs')
  , passport = require('passport')

require('express-namespace')

////////////////////////////////////////////////
// Configurations
////////////////////////////////////////////////
var env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , auth = require('./authorization')


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
// Start the App on <port>
////////////////////////////////////////////////
var port = process.env.PORT || 3000
app.listen(port)
console.log('Express app started on port '+port)