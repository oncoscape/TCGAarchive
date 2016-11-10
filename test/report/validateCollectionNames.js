/* 
  This is the code to validate Collection names to meet all alphanumeric, dash and underscore
  requires: co-mongodb     
*/
console.time();
var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
const helper = require("../testingHelper.js");
var elem = [];
var db, collection, collections, collection_names;
var collection_counts = [];
var manifest, manifest_arr, manifest_collection_names;
var lookup_table;
var keyFields = [];
var lookup_listed_collections = [];
var collectionNameRegex = /[A-Za-z0-9_-]+/g;
var usedFields = ['annotation','location','category','molecular','clinical','calculated','edges'];

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
  keyFields = [].concat.apply([], keyFields);
  keyFields = keyFields.unique();
  keyFields = [ '_id','disease','source','beta','annotation','location','category','name','img','rna','molecular','clinical','calculated','edges' ]
  //only iterate 'annotation','location','category','molecular','clinical','calculated','edges'

  lookup_table.forEach(function(d){
    for(var u=0; u<usedFields.length; u++){
      if(usedFields[u] in d){
        if(usedFields[u] == 'clinical'){
          var obj = d['clinical'];
          Object.keys(obj).forEach(function(k){
            lookup_listed_collections.push(obj[k]);
          });
        }else if('collection' in d[usedFields[u]]){
          lookup_listed_collections.push(d[usedFields[u]['collection']]);
        }else if(Array.isArray(d[usedFields[u]])){
          var arr = d[usedFields[u]];
          arr.forEach(function(a){
            if('collection' in a){
              lookup_listed_collections.push(a['collection']);
            }else if('edges' in a){
              lookup_listed_collections.push(a['edges']);
              lookup_listed_collections.push(a['patientWeights']);
              lookup_listed_collections.push(a['genesWeights']);
            }
          })
        }
      }
    }
  });//flatten all the collections from lookup_oncoscape_datasources 
  lookup_listed_collections = lookup_listed_collections.unique();
  var lookup_matched = lookup_listed_collections.map(function(c){return c.match(collectionNameRegex)[0];});
  var lookup_compare_result = lookup_listed_collections.includesArray(lookup_matched);
  console.log("*****lookup table collection naming validation:");
  console.log(lookup_compare_result.includes.length);
  console.log("not matched examples: ", lookup_compare_result.notIncluded.splice(0,5));
  
  manifest = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield manifest.find({}).toArray();
  manifest_collection_names = manifest_arr.map(function(m){return m.collection;});
  var manifest_matched = manifest_collection_names.map(function(c){return c.match(collectionNameRegex)[0];});
  var manifest_compare_result = manifest_collection_names.includesArray(manifest_matched);
  console.log("*****manifest collection naming validation:");
  console.log(manifest_compare_result.includes.length);
  console.log("not matched examples: ", manifest_compare_result.notIncluded.splice(0,5));
  
  collections = yield comongo.db.collections(db);
  collection_names = collections.map(function(c){return c['s']['name'];});
  var collection_matched = collection_names.map(function(c){return c.match(collectionNameRegex)[0];});
  var collection_compare_result = collection_names.includesArray(collection_matched);
  console.log("*****Current database collection naming validation:");
  console.log(collection_compare_result.includes.length);
  console.log("not matched examples: ", collection_compare_result.notIncluded.splice(0,5));
  yield comongo.db.close(db);
}).catch(onerror);


