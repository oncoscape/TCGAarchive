/* 
This is the code to generate collection_counts.json
requires: co-mongodb
Purposes
        - for each collection, collect collection name, count, fields of the first record and type
        - should report the existence of collections and the discrepancy against manifest/lookup_oncoscape_datasource
Runtime: 142997ms        
*/
console.time();
var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
var elem = [];
var db, collection, collections;
var collection_counts = [];
var manifest, manifest_arr;
var lookup, lookup_arr;

var onerror = function(e){
    console.log(e);
};

Array.prototype.findTypeByCollection = function(v){
  for(var i = 0; i < this.length; i++) {
    if(this[i].collection === v){
      //console.log(this[i].collection);
      //return this[i].dataType;
      return this[i].dataType;
    } 
  }
  return false;
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  manifest = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield manifest.find({}).toArray();
  lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
  lookup_arr = yield lookup.find({}).toArray();
  
  // collections = yield comongo.db.collections(db);
  
  // for(var i=0;i<collections.length;i++){
  //   var elem = {};
  //   var fields = [];
  //   var count;
    
  //   if(collections[i]['s']['name'] != 'system.users'){
  //     collection = yield comongo.db.collection(db, collections[i]['s']['name']);
  //     count = yield collection.count();
  //     var one = yield collection.findOne();
  //     fields = Object.keys(one);
  //     elem['collection'] = collections[i]['s']['name'];
  //     elem['count'] = count;
  //     elem['fields'] = fields;
  //     elem['type'] = manifest_arr.findTypeByCollection(collections[i]['s']['name']);
  //     collection_counts.push(elem);
  //   }
  //   console.log("******* current index is: ", i);
    
  // }
  //jsonfile.writeFile("../collection_counts_10262016.json", collection_counts, {spaces: 2}, function(err){ console.error(err);});  
  jsonfile.writeFile("../manifest_arr.json", manifest_arr, {spaces: 2}, function(err){ console.error(err);});  
  jsonfile.writeFile("../lookup_arr.json", lookup_arr, {spaces: 2}, function(err){ console.error(err);});  
  /*** Test Item 4: PCA & MDS calculated with each geneset
   ***/
  console.timeEnd();
  yield comongo.db.close(db);
}).catch(onerror);


