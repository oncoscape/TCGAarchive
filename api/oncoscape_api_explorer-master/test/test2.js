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
  var obj_arr = [];
  
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
    // collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');

    // disease_tables = yield collection.find({}).toArray();
    // var count = yield collection.count();
    // console.log("*****", count);
    // disease_tables.forEach(function(d){
    //   keyFields.push(Object.keys(d));
    // });
    // keyFields = [].concat.apply([], keyFields);
    // keyFields = keyFields.unique();
    
    // disease_tables.forEach(function(d){
    //   for(var u=0; u<usedFields.length; u++){
    //     if(usedFields[u] in d){
    //       if('collection' in d[usedFields[u]]){
    //         listed_collections.push(d[usedFields[u]['collection']]);
    //       }else if(Array.isArray(d[usedFields[u]])){
    //         var arr = d[usedFields[u]];
    //         arr.forEach(function(a){
    //           if('collection' in a){
    //             listed_collections.push(a['collection']);
    //           }else if('edges' in a){
    //             listed_collections.push(a['edges']);
    //           }else if('patientWeights' in a){
    //             listed_collections.push(a['patientWeights']);
    //           }else if('genesWeights' in a){
    //             listed_collections.push(a['genesWeights']);
    //           }else {
    //             listed_collections.push(a);
    //           }
    //         })
    //       }
    //     }
    //   }
    // });//flatten all the collections from lookup_oncoscape_datasources 


    collections = yield comongo.db.collections(db);
    // collection_names = collections.map(function(c){
    //   return c['s']['name'];
    // }); //getting the names of all collections

    
    // collection_names.forEach(function(c){
    //   if(listed_collections.indexOf(c) == -1){
    //     inDBNotInListed.push(c);
    //   }
    // });
    // listed_collections.forEach(function(l){
    //   if(collection_names.indexOf(l) == -1){
    //     inListedNotInDB.push(l);
    //   }
    // });

    /* Test time: Mon Sep  5 17:27:23 PDT 2016
     * inDBNotInListed.length = 491;  inListedNotInDB: [ 'undefined_color_tcga_import' ]
     */


    //AN EXEPRIMENT TO FIND THE COUNTS FOR ALL COLLECTIONS
    var elem = {};
    var fields = [];
    //for(var i=0;i<collections.length;i++){
    for(var i=76;i<77;i++){  
      elem = {};
      fields = [];
      if(collections[i]['s']['name'] != 'system.users'){
        collection = yield comongo.db.collection(db, collections[i]['s']['name']);
        count = yield collection.count();
        // var one = yield collection.findOne();
        // fields = Object.keys(one);
        // elem['collection'] = collections[i]['s']['name'];
        // elem['count'] = count;
        // elem['fields'] = fields;
        // collection_counts.push(elem);
        var j = 0;      
        var cursor = collection.find();
        cursor.each(function(err, item){
          obj_arr.push(item);
          console.log(j);
          j++;
        });
        // cursor.each(function(err, item){
        //   console.log(collections[i]['s']['name']);
        //   if(item != null) {
        //     // Show that the cursor is closed
        //     cursor.toArray(function(err, items) {
        //        console.dir(item);
        //     });
        //   };
        // });
        // collection.find().batchSize(100).nextObject(function(err, item) {
        //   console.dir(item);
          // cursor.close(function(err, result) {
          //   assert.equal(null, err);
          //   assert.equal(true, cursor.isClosed());
          // });
        //});
      }
      console.log(i);
      
    }
    //jsonfile.writeFile("collection_counts.json", collection_counts, {spaces: 2}, function(err){ console.error(err);});  
  
    /*** Test Item 4: PCA & MDS calculated with each geneset
     ***/

    yield comongo.db.close(db);
  }).catch(onerror);


