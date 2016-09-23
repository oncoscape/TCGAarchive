  // const _ = require('underscore');
  // Test Items
  /* 1. all molecular table sample IDs in  <disease>_<source>_sample_map
     2. one-to-one for collections & lookup_oncoscape_datasources (with no duplicates in lookup table)
     3. Molecular data follows JSON schema
     4. PCA & MDS calculated with each geneset
     5. patient/sample names formatted correctly
     6. all file types present: molecular, clinical, color categories, edges, mds & pca, etc
   */

  /*
     Cool feature would be to load from file schema.json
     Pass name of file when running scripatient "node mongoTest.js -f nameof.json"
     npm fs library 
  */
  var jsonfile = require("jsonfile");
  var comongo = require('co-mongodb');
  var co = require('co');
  var assert = require('assert');
  var Ajv = require('ajv');
  var ajv = new Ajv();

  var molecular_schemas = {
      "cnv":{
             "cnv":{
                 "properties":{
                   "gene": {"type": "string"},
                   "min": {"type": "float", "maximum": 2.0 ,"minimum": -2.0},
                   "max": {"type": "float", "maximum": 2.0 ,"minimum": -2.0},
                   "patients" : {"type": "string"}
                   }
                  },
              "required": ["_id","gene","min","max","patients"],
              "additionalProperties": true  
              },
        "mut":{
             "mut":{
                 "properties":{
                   "gene": {"type": "string"},
                   "min": {"type": "integer", "maximum": 2 ,"minimum": -2},
                   "max": {"type": "integer", "maximum": 2 ,"minimum": -2},
                   "patients" : {"type": "string"}
                   }
                  },
              "required": ["_id","gene","min","max","patients"],
              "additionalProperties": true  
              },
         "edges": {
              "edges":{
                     "properties":{
                       "m": {"type": "string"},
                       "g": {"type": "string"},
                       "p" : {"type": "string"}
                       }
                      },
                  "required": ["m", "g", "p"],
                  "additionalProperties": true  

         }           
    };

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
  co(function *() {

    db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
      '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
      'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

    /*** Test Item 2: one-to-one mapping between all the collections in the database and 
         lookup_oncoscape_datasources collection
     ***/
    collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
    // collection = yield comongo.db.collection(db, 'blca_edges_ucsc_markergenes545-mut01-cnv');
    // collection_arr = yield collection.find({}).toArray();
  //   yield comongo.db.close(db);
  // }).catch(onerror);

    disease_tables = yield collection.find({}).toArray();
    var count = yield collection.count();
    console.log("*****", count);
    disease_tables.forEach(function(d){
      keyFields.push(Object.keys(d));
    });
    keyFields = [].concat.apply([], keyFields);
    keyFields = keyFields.unique();
    // keyFields = [ '_id','disease','source','beta','annotation','location','category','name','img','rna','molecular','clinical','calculated','edges' ]
    // only iterate 'annotation','location','category','molecular','clinical','calculated','edges'

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

    /* Test time: Mon Sep  5 17:27:23 PDT 2016
     * inDBNotInListed.length = 491;  inListedNotInDB: [ 'undefined_color_tcga_import' ]
     */


    //AN EXEPRIMENT TO FIND THE COUNTS FOR ALL COLLECTIONS
    var elem = {};
    var fields = [];
    //for(var i=0;i<collections.length;i++){
    for(var i=100;i<101;i++){  
      elem = {};
      fields = [];
      console.log(collections[i]['s']['name']);
      if(collections[i]['s']['name'] != 'system.users'){
        collection = yield comongo.db.collection(db, collections[i]['s']['name']);
        count = yield collection.count();
        // var one = yield collection.findOne();
        // fields = Object.keys(one);
        // elem['collection'] = collections[i]['s']['name'];
        // elem['count'] = count;
        // elem['fields'] = fields;
        // collection_counts.push(elem);
      
        var cursor = yield collection.find().limit(1).toArray();
        collection.find().batchSize(100).nextObject(function(err, item) {
          console.dir(item);
        });
      }
      console.log(i);
      
    }
    jsonfile.writeFile("collection_counts.json", collection_counts, {spaces: 2}, function(err){ console.error(err);});  
    // collections.forEach(function(col){
    //   console.log(col['s']['name']);
    //   collection = yield comongo.db.collection(db, col['s']['name']);
    //   count = yield collection.count();
    //   console.log(count);
    // })
    /*** Test Item 3: Molecular data follows JSON schema
     ***/
    // collection = yield comongo.db.collection(db, 'brca_cnv_cbio_gistic');
    // sample = yield collection.find({}).toArray();
    // console.log(sample.length);
    // var v = ajv.validate(molecular_schemas['cnv'],sample[0]);
    // if(!v){
    //   console.log(ajv.errors[0]);
    // }else{
    //   console.log(v);
    // };          
    /* <--- Last few GCs --->

      491592 ms: Scavenge 1335.0 (1457.9) -> 1334.9 (1457.9) MB, 0.4 / 0 ms [allocation failure].
      491594 ms: Scavenge 1334.9 (1457.9) -> 1334.9 (1457.9) MB, 0.4 / 0 ms [allocation failure].
      491594 ms: Scavenge 1334.9 (1457.9) -> 1334.9 (1457.9) MB, 0.3 / 0 ms [allocation failure].
      492063 ms: Mark-sweep 1334.9 (1457.9) -> 1335.0 (1457.9) MB, 468.7 / 0 ms [last resort gc].
      492527 ms: Mark-sweep 1335.0 (1457.9) -> 1335.0 (1457.9) MB, 464.2 / 0 ms [last resort gc].


      <--- JS stacktrace --->

      ==== JS stack trace =========================================

      Security context: 0x3ae023cb4629 <JS Object>
      
      FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory
      Abort trap: 6
    */



    /*** Test Item 4: PCA & MDS calculated with each geneset
     ***/

    yield comongo.db.close(db);
  }).catch(onerror);


