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
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
var elem = [];
var db, collection, collections;
var collection_counts = [];
var manifest, manifest_arr;

var onerror = function(e){
    console.log(e);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  manifest = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield manifest.find({}).toArray();
  collections = yield comongo.db.collections(db);
  
  for(var i=0;i<collections.length;i++){
    var elem = {};
    var fields = [];
    var count;
    
    if(collections[i]['s']['name'] != 'system.users'){
      collection = yield comongo.db.collection(db, collections[i]['s']['name']);
      count = yield collection.count();
      //var one = yield collection.findOne();
      //fields = Object.keys(one);
      elem['collection'] = collections[i]['s']['name'];
      elem['count'] = count;
      //elem['fields'] = fields;
      elem['type'] = manifest_arr.findTypeByCollection(collections[i]['s']['name']);
      collection_counts.push(elem);
    }
    console.log("******* current index is: ", i);
    
  }
  jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/collection_counts.json", collection_counts, {spaces: 2}, function(err){ console.error(err);});  
  console.timeEnd(); //52550ms
  yield comongo.db.close(db);
}).catch(onerror);

