// Organization Schema

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  //, roles = ['admin', 'member', 'guest']

var OrganizationSchema = new Schema({
    title: {type : String, default : '', trim : true}
  , members: [{type : Schema.ObjectId, ref : 'User', role : String}]
  , streams: [{type : Schema.ObjectId, ref : 'Stream'}]
  , date_created: {type : Date, default : Date.now}
  , date_updated: {type : Date, default : Date.now}
})

OrganizationSchema.path('title').validate(function (title) {
  return title.length > 0
}, 'Organization title cannot be blank')

mongoose.model('Organization', OrganizationSchema)