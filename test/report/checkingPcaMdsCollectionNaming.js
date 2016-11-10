/* 
  Checking PCA/MDS Collections    
*/
// MDS, mutation and copy number, all of them are genesets
// check the names, 
// look at each gene-set, from the same sources (mut, copy)
// PCA, for RNA, methylation, protein, CNV, for those molecular types, with each genesets


var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
const helper = require("../testingHelper.js");
var elem = [];
var db, collection, collections, collection_names;
var collection_counts = [];
var lookup_table;

var onerror = function(e){
    console.log(e);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
  lookup_table = yield collection.find({}).toArray();
  lookup_table.forEach(function(d){
    keyFields.push(Object.keys(d));
  });
 
  lookup_listed_collections = lookup_listed_collections.unique();
  var lookup_matched = lookup_listed_collections.map(function(c){return c.match(collectionNameRegex)[0];});
  var lookup_compare_result = lookup_listed_collections.includesArray(lookup_matched);
  console.log("*****lookup table collection naming validation:");
  console.log(lookup_compare_result.includes.length);
  console.log("not matched examples: ", lookup_compare_result.notIncluded.splice(0,5));
  
  collections = yield comongo.db.collections(db);
  collection_names = collections.map(function(c){return c['s']['name'];});
  var collection_matched = collection_names.map(function(c){return c.match(collectionNameRegex)[0];});
  var collection_compare_result = collection_names.includesArray(collection_matched);
  
  
  
  yield comongo.db.close(db);
}).catch(onerror);

