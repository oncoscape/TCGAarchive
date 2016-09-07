const _ = require('underscore');
const mongoose = require("mongoose");
mongoose.Promise = require('bluebird');

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
var collections_existing = [];
var collections_listed = [];
connection.once('open', function(){
    var db = connection.db;
    collection = db.collection('lookup_oncoscape_datasources');
    collection.find({},{"collections":true}).toArray(function(err, documents) {
      if (err){ 
      	console.dir(err); 
      }else{
      	db.listCollections().toArray(function(err, collections){	
      		collections.forEach(function(col){
      			collections_existing.push(col.name);
      		});
      		console.log(collections_existing.length);
      	});

      	documents.forEach(function(doc){
      		Object.keys(doc.collections).forEach(function(key){
      		collections_listed.push(doc.collections[key]);	
      		// 	db.listCollections({name: doc.collections[key]})
      		// 	  .next(function(err, collinfo){
      		// 	  	console.log(doc.collections[key]);
			    	// if (collinfo){
			    	// 	collections_listed.push(doc.collections[key]);
			    	// } 
			    	// //process.exit(0);
			    // });
      		});
      	});
      	console.log(collections_listed.length);
      }
    });
});


mongoose.Promise = require('q').Promise;
http://eddywashere.com/blog/switching-out-callbacks-with-promises-in-mongoose/

