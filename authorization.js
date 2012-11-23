
/*
 *  Generic require login routing middleware
 */

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
      if (req.profile.id != req.user.id) {
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
      if (req.stream.members.indexOf(req.user._id) !== -1) {
        return res.redirect('/streams/'+req.stream.id)
      }
      next()
    }
}
