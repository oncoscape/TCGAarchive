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
var u = require('underscore');
var elem = [];
var db, collection, collections;
var collection_counts = [];
var manifest = require("../manifest_arr.json");
var sampleTable;
var sampleMapCollections =  manifest.filter(function(m){return m.dataType == "samplemap"});
var result = [];
var onerror = function(e){
    console.log(e);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');
  
  // result = sampleMapCollections.forEach(function(m){
  //   var col = m.collection;
  //   console.log(col);
  //   // collection = yield comongo.db.collection(db, col);
  //   // sampleTable = yield collection.find({}).toArray();
  //   console.log(sampleTable);
  //   // var elem = {};
  //   // elem.disease = m.dataset;
  //   // elem.sampleCount = sampleTable[0].length;
  //   // return elem;
  // });

  for(var i =0; i<sampleMapCollections.length; i++){
    collection = yield comongo.db.collection(db, sampleMapCollections[i].collection);
    sampleTable = yield collection.find({}).toArray();
    console.log(sampleMapCollections[i].dataset);
    //console.log(sampleTable);
    if(sampleTable.length != 0){
      var sampleIDs = Object.keys(sampleTable[0]);
      var ptIDs = Object.keys(sampleTable[0]).map(function(str){
        return str.substring(0, 12);
      });
      console.log("Sample IDs length is: ", u.uniq(sampleIDs).length);
      console.log("Patient IDs length is: ", u.uniq(ptIDs).length);
    }
  }
  console.timeEnd();
  yield comongo.db.close(db);
}).catch(onerror);


