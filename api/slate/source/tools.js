//var connectionString = 'mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017/os';
//var comongo = require('co-mongodb');
//var co = require('co');
//var db = "os";
const _ = require('underscore');
//var MongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");

var format = {
  h1: function(text) { console.log(); console.log('# '+text); },
  h2: function(text) { console.log(); console.log('## '+text); },
  h3: function(text) { console.log(); console.log('### '+text); },
  h4: function(text) { console.log(); console.log('#### '+text); },
  text: function(text){ console.log(text); },
  url: function(text) {console.log(); console.log('`' + text + '`'); console.log();},
  codeStart: function() { console.log(); console.log('```'); },
  codeComment: function(text) {console.log(); console.log('>' + text);},
  codeStop: function() { console.log(); console.log('```'); },
  code: function(text) { console.log('"'+ text + '"'); },
  jsonfy: function(text) { console.log('{' + text + '}');},
  codeR: function(text) { console.log("```r"); console.log(text); console.log("```")},
  codeMongo: function(text) { console.log("```mongo"); console.log(text); console.log("```")},
  codeJS: function(text) { console.log("```javascript"); console.log(text); console.log("```")},
  codePy: function(text) { console.log("```python"); console.log(text); console.log("```")},
};

format.h1("Tools");
// Connect to the db
mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/os?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var connection = mongoose.connection;
connection.once('open', function(){

    var db = connection.db;
    /* First Query on lookup_oncoscape_datasources */
    collection = db.collection('lookup_oncoscape_tools');
    collection.find().toArray(function(err, documents) {
      if (err){ console.dir(err); }
      documents.forEach(function(doc){
          format.h3(doc.name);
          format.text(doc.desc);
        });
      process.exit(0);
    });
}); 



