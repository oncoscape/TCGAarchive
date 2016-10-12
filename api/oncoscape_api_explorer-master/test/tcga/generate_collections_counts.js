/* 
This is the code to generate collection_counts.json
requires: co-mongodb
          lookup_arr.json
          manifest_arr.json
Purposes
        - for each collection, collect collection name, count, fields of the first record and type
        - should report the existence of collections and the discrepancy against manifest/lookup_oncoscape_datasource
*/
var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
var assert = require('assert');
var Ajv = require('ajv');
var ajv = new Ajv();
var obj_arr = [];
var lookup_arr = [];
var manifest_arr = [];
// jsonfile.readFile("lookup_arr.json", function(err, obj){
//   lookup_arr = obj;
// });
// jsonfile.readFile("manifest_arr.json", function(err, obj){
//   manifest_arr = obj;
// });


var onerror = function(e){
  console.log(e);
}


Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
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




var ajvMsg = [];
var disease_tables = [];
var disease_collections = {};
var passed_elem = [];
var error_elem = [];
var elem = [];
var elem2 = [];
var msg = {};
var msg_tool = {};
var db, collection, collections, collection_names;
var diseases = [];
var listed_collections = [];
var tool_names = [];
var disease_tables_length;
var tool_names_length;
var tool;      
var tool_tbls_required = [];
var tool_tbls_required_length;
var tbl = {};
var tbl_doc = [];
var new_disease_tables = [];         
var keyFields = [];
var usedFields = ['annotation','location','category','molecular','clinical','calculated','edges'];
var inDBNotInListed = [];
var inListedNotInDB = [];
var sample = [];
var collection_counts = [];
var manifest, manifest_arr;

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  /*** Test Item 2: one-to-one mapping between all the collections in the database and 
       lookup_oncoscape_datasources collection
   ***/
  collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
  disease_tables = yield collection.find({}).toArray();
  var count = yield collection.count();
  console.log("*****", count);
  disease_tables.forEach(function(d){
    keyFields.push(Object.keys(d));
  });
  keyFields = [].concat.apply([], keyFields);
  keyFields = keyFields.unique();
  keyFields = [ '_id','disease','source','beta','annotation','location','category','name','img','rna','molecular','clinical','calculated','edges' ]
  //only iterate 'annotation','location','category','molecular','clinical','calculated','edges'

  disease_tables.forEach(function(d){
    for(var u=0; u<usedFields.length; u++){
      if(usedFields[u] in d){
        if('collection' in d[usedFields[u]]){
          listed_collections.push(d[usedFields[u]['collection']]);
        }else if(Array.isArray(d[usedFields[u]])){
          var arr = d[usedFields[u]];
          arr.forEach(function(a){
            if('collection' in a){
              listed_collections.push(a['collection']);
            }else if('edges' in a){
              listed_collections.push(a['edges']);
            }else if('patientWeights' in a){
              listed_collections.push(a['patientWeights']);
            }else if('genesWeights' in a){
              listed_collections.push(a['genesWeights']);
            }else {
              listed_collections.push(a);
            }
          })
        }
      }
    }
  });//flatten all the collections from lookup_oncoscape_datasources 

  manifest = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield manifest.find({}).toArray();
  collections = yield comongo.db.collections(db);
  collection_names = collections.map(function(c){
    return c['s']['name'];
  }); //getting the names of all collections

  
  collection_names.forEach(function(c){
    if(listed_collections.indexOf(c) == -1){
      inDBNotInListed.push(c);
    }
  });
  listed_collections.forEach(function(l){
    if(collection_names.indexOf(l) == -1){
      inListedNotInDB.push(l);
    }
  });

  /* Test time: Mon Oct  10 16:23:23 PDT 2016
   * inDBNotInListed.length = 711;  
     inListedNotInDB: 
     [ 'brain_mds_ucsc_mds-oncovogel274-cnv-mut01-ucsc',
      'brain_mds_ucsc_mds-oncovogel274-cnv-mut01-1e+05-ucsc',
      'brca_psi_bradleyLab_miso' ]
   */

  //AN EXEPRIMENTvar elem = {};
  var fields = [];
  for(var i=0;i<collections.length;i++){
    elem = {};
    fields = [];
    
    if(collections[i]['s']['name'] != 'system.users'){
      collection = yield comongo.db.collection(db, collections[i]['s']['name']);
      count = yield collection.count();
      var one = yield collection.findOne();
      fields = Object.keys(one);
      elem['collection'] = collections[i]['s']['name'];
      elem['count'] = count;
      elem['fields'] = fields;
      elem['type'] = manifest_arr.findTypeByCollection(collections[i]['s']['name']);
      collection_counts.push(elem);
    }
    console.log("******* current index is: ", i);
    
  }
  jsonfile.writeFile("../collection_counts.json", collection_counts, {spaces: 2}, function(err){ console.error(err);});  
  
  /*** Test Item 4: PCA & MDS calculated with each geneset
   ***/

  yield comongo.db.close(db);
}).catch(onerror);


