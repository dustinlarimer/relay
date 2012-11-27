/**
 * Module dependencies.
 */

var parent = module.parent.exports 
  , app = parent.app
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , express = require('express')
  , mongoStore = require('connect-mongodb')
  , redisStore = require('connect-redis')(express)
  , sessionStore = parent.sessionStore
  , lessMiddleware = require('less-middleware')
  //, sessionStore;

exports.boot = function(app, config, passport){
  bootApplication(app, config, passport)
}

////////////////////////////////////////////////
// App Settings and Middleware
////////////////////////////////////////////////

function bootApplication(app, config, passport) {

	app.set('showStackError', true)
	app.use(lessMiddleware({
		  once: false
		, debug: true
		, dest: __dirname + '/public/css'
		, src: __dirname + '/public/less'
		, prefix: '/css'
		, compress: true
	}))
	app.use(express.static(__dirname + '/public'))
	app.use(express.logger(':method :url :status'))

	// set views path, template engine and default layout
	app.set('views', __dirname + '/app/views')
	app.set('view engine', 'jade')
	
	app.configure(function () {
    // dynamic helpers
	app.use(function (req, res, next) {
		res.locals.appName = 'Harbor Demo'
		res.locals.title = 'Harbor Demo'
		res.locals.showStack = app.showStackError
		res.locals.req = req
		res.locals.formatDate = function (date) {
			var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec" ]
			return monthNames[date.getMonth()]+' '+date.getDate()+', '+date.getFullYear()
		}
		res.locals.stripScript = function (str) {
			return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		}
		res.locals.createPagination = function (pages, page) {
			var url = require('url')
			, qs = require('querystring')
			, params = qs.parse(url.parse(req.url).query)
			, str = ''

			params.page = 0
			var clas = page == 0 ? "active" : "no"
			str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">First</a></li>'
			for (var p = 1; p < pages; p++) {
				params.page = p
				clas = page == p ? "active" : "no"
				str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">'+ p +'</a></li>'
			}
			params.page = --p
			clas = page == params.page ? "active" : "no"
			str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">Last</a></li>'

			return str
		}

		next()
	})

    // cookieParser should be above session
    app.use(express.cookieParser())

    // bodyParser should be above methodOverride
    app.use(express.bodyParser())
    app.use(express.methodOverride())

	//sessionStore = new redisStore({host: config.session.host});
	app.use(express.session({
	    // pwgen ftw
	    secret: config.session.secret,
	    store: module.parent.exports.sessionStore,
	    maxAge: new Date(Date.now() + 30 * 7 * 24 * 3600 * 1000),
	    key: 'harbor'
	}))
	/*
    app.use(express.session({
      secret: 'harbor',
      store: new mongoStore({
        url: config.db,
        collection : 'sessions'
      })
    }))
	*/
    app.use(passport.initialize())
    app.use(passport.session())

    app.use(express.favicon())

    // routes should be at the last
    app.use(app.router)

    // assume "not found" in the error msgs
    // is a 404. this is somewhat silly, but
    // valid, you can do whatever you like, set
    // properties, use instanceof etc.
    app.use(function(err, req, res, next){
      // treat as 404
      if (~err.message.indexOf('not found')) return next()

      // log it
      console.error(err.stack)

      // error page
      res.status(500).render('500')
    })

    // assume 404 since no middleware responded
    app.use(function(req, res, next){
      res.status(404).render('404', { url: req.originalUrl })
    })

  })

  app.set('showStackError', false)

}