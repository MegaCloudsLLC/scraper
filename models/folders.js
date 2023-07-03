var mongoose = require('mongoose');
var schema = mongoose.Schema;

var recordsModel = new schema({
  user_id: {
    type: String,
  },
  business_name: {
    type: String,
    required: true,
  },
  business_address: {
    type: String,
    required: true,
  },
  website: {
    type: String,
  },
  emails: {
    type: String,
  },
  phone: {
    type: String,
  },
  rating: {
    type: String,
  },
});

var foldersModel = new schema({
  folder_name: {
    type: String,
    required: true,
  },
  folder_type: {
    type: String,
    required: true,
  },
  last_updated: {
    type: String,
    required: true,
  },
  folder_records: [recordsModel],
});

var folderModel = mongoose.model('folders', foldersModel);
module.exports = folderModel;
