const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
mongoose.set('strictQuery', true);
var url =
  'mongodb+srv://MG-Clouds:6CoRoHuqoYlmwdnd@scraper.qikx7vd.mongodb.net/folders?retryWrites=true&w=majority';

var connection = async () => {
  try {
    var client = new MongoClient(url, { useNewUrlParser: true });
    await client.connect().then((res) => {
      console.log('Database connected');
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
// mongodb://127.0.0.1:27017/Scraper
// %40 %26 for = @ abd & respectively.
module.exports = connection();
