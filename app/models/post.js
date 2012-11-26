// Post Schema

var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var PostSchema = new Schema({
	stream: {type : Schema.ObjectId, ref : 'Stream'}
  , body: {type : String, default : ''}
  , owner: {type : Schema.ObjectId, ref : 'User'}
  , date_created: {type : Date, default : Date.now}
})

PostSchema.path('body').validate(function (body) {
  return body.length > 0
}, 'Posts cannot be blank')

mongoose.model('Post', PostSchema)