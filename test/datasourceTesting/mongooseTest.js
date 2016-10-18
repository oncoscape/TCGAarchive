/* 
This is the code to generate ajv.json, the stage I datasource schema validation
requires: mongoose
          collection_counts.json.json generated by generate_collections_counts.js
          schema_tcga.json
Purposes
        - substratify the entire collections to dataType collections
          and run schemas.json ajv validation on each collection 
          error message at the document level will be reported
*/
var jsonfile = require("jsonfile");
var assert = require('assert');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var forEach = require('async-foreach').forEach;
var asyncLoop = require('node-async-loop');
var async = require('async');
var ajvMsg = [];
var collection;
var collections = [];
var schemas = {};
var db;
const mongoose = require("mongoose");
var subgrp = [];
var j = 0; 
var i = 0;
var table_name;
var dataType, dataType_length;
var msg_type = {};
var passed_elem;
var error_elem = [];
//var error_elem;
var categoried_collections;
var categoried_collection_length;
var category_index;
var elem = {};

jsonfile.readFile("../collection_counts.json", function(err, obj) {
  collections = obj;
});

jsonfile.readFile("../schemas.json", function(err, obj) {
  schemas = obj;
  dataType = Object.keys(schemas);
  dataType_length = dataType.length;
});


Array.prototype.findCollectionsByType = function(v){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].type === v){
      arr.push(this[i].collection);
    } 
  }
  return arr;
};

mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var connection = mongoose.connection;
var col_count = 0;
connection.once('open', function(){
    var db = connection.db; 
    asyncLoop(dataType, function(t, next){  
      console.log("Within datatype: ", t);
      var categoried_collections = collections.findCollectionsByType(t); 
      var categoried_collection_length = categoried_collections.length; 
      var category_index = 0;

      var processNextTable = function(){
        var tableName = categoried_collections[category_index];
        console.log("test" , col_count++);
        var collection = db.collection(tableName);
        var cursor = collection.find();
        count = 0;
        msg_type = {};
        passed_elem = 0;
        error_elem = [];
        elem = {};
        cursor.each(function(err, item){
          if(item != null){
            count++;
            var valid = ajv.validate(schemas[t], item);
            if(!valid){
              var e = {};
              e.errorType = ajv.errors[0].schemaPath; 
              error_elem.push(e);
            }
            else{
              passed_elem++;
            }
            msg_type.collection = tableName;
            msg_type.type = t;
            msg_type.disease = tableName.split('_')[0];
            msg_type.passedCounts = passed_elem;
            msg_type.totalCounts = count;
            msg_type.errors = error_elem;
            ajvMsg[col_count-1] = msg_type;
          }else{// No more items to process So move to the next table
            category_index += 1;
            if (category_index<categoried_collection_length){
              processNextTable();
            }else{
              next();
            }
          }
        });
      };
      // Call processNextTable recursively
      if(categoried_collection_length != 0){
        processNextTable();
      }else{
        next();
      }
    }, function (err)
    {
        if (err)
        {
            console.error('Error: ' + err.message);
            return;
        }
     
        console.log('Finished!');
    });

});

// jsonfile.writeFile("ajv_tcga.json", ajvMsg, {spaces: 4}, function(err){ console.error(err);}); 
// mongoose.connection.close(); 
//     