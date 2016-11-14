/* 
This is the code to compare the pancan12 z-gene with the tcga gene symbol curation
*/
var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
var helper = require("../testingHelper.js");
var db, collection, collections;
var zgene;

var onerror = function(e){
    console.log(e);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');

  collection = yield comongo.db.collection(db, "z-gene");
  zgene = yield collection.find().toArray();
  console.log(zgene[0]);
  yield comongo.db.close(db);
}).catch(onerror);

