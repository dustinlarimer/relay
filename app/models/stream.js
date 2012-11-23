// Stream Schema

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  //, roles = ['moderator', 'member', 'guest']

var StreamSchema = new Schema({
    title: {type : String, default : '', trim : true}
  , members: [{type : Schema.ObjectId, ref : 'User'}]
  , posts: [{type : Schema.ObjectId, ref : 'Post'}]
  , date_created: {type : Date, default : Date.now}
  , date_updated: {type : Date, default : Date.now}
})

StreamSchema.path('title').validate(function (title) {
  return title.length > 0
}, 'Stream title cannot be blank')

mongoose.model('Stream', StreamSchema)