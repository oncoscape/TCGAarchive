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
var mongoose = require("mongoose");
var elem = [];
var db, collection, collections;
var collection_counts = [];
var manifest, manifest_arr;
var lookup, lookup_arr;
var render_patient;
var render_pca;

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

  collection = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield collection.find({}).toArray();
  collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
  lookup_arr = yield collection.find({}).toArray();
  collection = yield comongo.db.collection(db, "render_pca");
  render_pca = yield collection.find({}).toArray();
  collection = yield comongo.db.collection(db, "render_patient");
  render_patient = yield collection.find({}).toArray();
  jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/manifest_arr.json", manifest_arr, {spaces: 2}, function(err){ console.error(err);});  
  jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/lookup_arr.json", lookup_arr, {spaces: 2}, function(err){ console.error(err);});  
  jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/render_pca.json", render_pca, {spaces: 2}, function(err){ console.error(err);});  
  jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/render_patient.json", render_patient, {spaces: 2}, function(err){ console.error(err);});  
  console.timeEnd();
  yield comongo.db.close(db);
}).catch(onerror);


