/* 
This is the code to compare the pancan12 z-gene with the tcga gene symbol curation
*/
var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
var helper = require("../testingHelper.js");
var db, collection, collections;
var zgenes;

var onerror = function(e){
    console.log(e);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');

  collection = yield comongo.db.collection(db, "z-genes");
  zgenes = yield collection.find().toArray();
  console.log(zgenes[0]);
  jsonfile.writeFile("zgenes.json", zgenes, {spaces: 4}, function(err){ console.error(err);});  
  yield comongo.db.close(db);
}).catch(onerror);

