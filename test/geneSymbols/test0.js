// console.time();
const mongoose = require("mongoose");
const fs = require("fs");
const jsonfile = require("jsonfile-promised");
const _ = require("underscore");
const input = require("/usr/local/airflow/docker-airflow/onco-test/dataStr/ajv_test2.json");
const asyncLoop = require('node-async-loop');
var lookup_oncoscape_genes = [];
var diseases;

var mongo = function(mongoose){
  return new Promise(function(resolve, reject) {
    var connection = mongoose.connect( 
      'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin', {
             db: { native_parser: true },
             server: { poolSize: 5, reconnectTries: Number.MAX_VALUE,socketOptions: { keepAlive: 3000000, connectTimeoutMS: 300000, socketTimeoutMS: 300000}},
             replset: { rs_name: 'rs0', socketOptions: { keepAlive: 3000000, connectTimeoutMS: 300000, socketTimeoutMS: 300000}},
             user: 'oncoscapeRead',
             pass: 'i1f4d9botHD4xnZ'
         });
       mongoose.connection.on('connected', function() {
        resolve(mongoose.connection.db);
       });
  });
};

// Create FileStream
var filestream = function(fs){
  return new Promise(function(resolve, reject){
  var stream = fs.createWriteStream("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/output.json",{  
        flags: 'w',
        defaultEncoding: 'utf8'
      });
      stream.on("open",function(){
        resolve(stream);
      });
  });
};

// Get Promises Based On Collection Type
var promiseFactory = function(db, collection, type, disease){
  return new Promise(function(resolve, reject){
    var elem = {};
    elem.collection = collection;
    elem.type = type;
    elem.disease = disease;
    type = type.trim().toUpperCase();
    //console.log(collection);   
    switch(type){
      case "MUT":
      case "MUT01":
      case "METHYLATION":
      case "RNA":
      case "PROTEIN":
      case "CNV":    
        db.collection(collection).distinct("gene").then(function(r){ 
          elem.geneIDs = r;
          resolve(elem); 
        });
        break;

      case "FACS":
        elem.geneIDs = db.collection(collection).mapReduce(
            function(){ for (var key in this.markers) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.geneIDs = r.map(function(v){ return v._id; }); resolve(elem); });
        break;

      case "EDGES":
        db.collection(collection).distinct("g").then(function(r){ 
          elem.geneIDs = r;
          resolve(elem); });
        break;

      case "GENESETS":
        db.collection(collection).distinct("genes").then(function(r){ 
          elem.geneIDs = r;
          resolve(elem); });
        break;

      case "ANNOTATION":
        db.collection(collection).distinct("HGNC_symbol").then(function(r){ 
          elem.geneIDs = r;
          resolve(elem); });
        break;
          
      case "GENEDEGREE":
        elem.geneIDs = db.collection(collection).mapReduce(
            function(){ for (var key in this) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.geneIDs = _.without(r.map(function(v){ return v._id; }), '_id'); resolve(elem); });
        break;

      case "GENES":
        elem.geneIDs = db.collection(collection).mapReduce(
            function(){ for (var key in this.data) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.geneIDs = r.map(function(v){ return v._id; }); resolve(elem); });
        break;

      case "PCALOADINGs":
        elem.geneIDs = db.collection(collection).mapReduce(
            function(){ for (var key in this.data) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.geneIDs = r.map(function(v){ return v._id; }); resolve(elem); });
        break;
          
      default:
        resolve(elem);
        break;
    }
  });
};

Promise.all([mongo(mongoose),filestream(fs)]).then(function(response){
    var db = response[0];
    var file = response[1];
    var index = 0;
    lookup_oncoscape_genes = db.collection("lookup_oncoscape_genes").find().toArray().then(function(res){
      jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/lookup_oncoscape_genes.json", res, {spaces: 4}); 
    });
    // console.log(index);
    file.write("[");
    asyncLoop(input, function(d, next){ 
      // console.log(d);
      // console.log(index++);
      index++;
      if('collection' in d){
        promiseFactory(db, d.collection, d.type, d.disease).then(function(res){
          file.write(JSON.stringify(res, null, 4));
          if(index != input.length){
            file.write(",");
          }else{
            file.write("]");
          }
          next();
        });
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
        // console.log('Finished!');
        // console.timeEnd(); // 
        mongoose.connection.close();
    });
  
}); //925462ms


