
/*
 *  Generic require login routing middleware
 */

var async = require('async')

exports.requiresLogin = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login')
  }
  next()
};


/*
 *  User authorizations routing middleware
 */

exports.user = {
    hasAuthorization : function (req, res, next) {
      if (req.profile.id != req.user._id) {
        return res.redirect('/users/'+req.profile.id)
      }
      next()
    }
}


/*
 *  Stream authorizations routing middleware
 */

exports.stream = {
	hasAuthorization : function (req, res, next) {
		var ok = false
		async.forEach(req.stream.members, function (item, callback){ 
			if (item._id.toString() === req.user._id.toString()){
				console.log('Request by a stream member')
				ok = true
			}
		    callback();
		}, function(err) {
			if (!ok){
				return res.redirect('/404/')
			}
			console.log("Passed? " + ok);
			next()
		});
	}
}
