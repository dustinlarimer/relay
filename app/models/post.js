// Post Schema

var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var PostSchema = new Schema({
    body: {type : String, default : ''}
  , _user: {type : Schema.ObjectId, ref : 'User'}
  , createdAt: {type : Date, default : Date.now}
  , user: {}
})

mongoose.model('Post', PostSchema)