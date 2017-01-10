const mongoose = require('mongoose');
const fs = require("fs");
const _ = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
const input = require("/usr/local/airflow/docker-airflow/onco-test/dataStr/ajv_test2.json");
const asyncLoop = require('node-async-loop');
// Connect To Database
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
  var stream = fs.createWriteStream("/usr/local/airflow/docker-airflow/onco-test/ptIDs/output.json",{  
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
    console.log(collection);   
    switch(type){
      case "PATIENT":
      case "DRUG":
      case "NEWTUMOR":
      case "OTHERMALIGNANCY":
      case "RADIATION":
      case "FOLLOWUP":
      case "NEWTUMOR-FOLLOWUP":
        db.collection(collection).distinct("patient_ID").then(function(r){ 
          elem.IDs = r;
          resolve(elem); });
        break;

      case "PCASCORES":
      case "MDS":
        db.collection(collection).mapReduce(
        function(){ for (var key in this.data) { emit(key, null); } },
        function(key, value) { return null }, 
        { out: {inline:1} }).then(function(r){ elem.IDs = r.map(function(v){ return v._id; }); resolve(elem); });
        break;

      case "MUT":
      case "MUT01":
      case "METHYLATION":
      case "RNA":
      case "PROTEIN":
      case "CNV":
      case "PSI":    
        elem.IDs = db.collection(collection).mapReduce(
            function(){ for (var key in this.patients) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.IDs = r.map(function(v){ return v._id; }); resolve(elem); });
        break;

      case "COLOR":
        db.collection(collection).distinct("data.values").then(function(r){ 
          elem.IDs = r;
          resolve(elem); });
        break;

      case "EVENTS":
        elem.IDs = db.collection(collection).mapReduce(
            function(){ for (var key in this) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.IDs = _.without(r.map(function(v){ return v._id; }), '_id'); resolve(elem); });
        break;


      case "EDGES":
        db.collection(collection).distinct("p").then(function(r){ 
          elem.IDs = r;
          resolve(elem); });
        break;

      case "PTDEGREE":
        elem.IDs = db.collection(collection).mapReduce(
            function(){ for (var key in this) { emit(key, null); } },
            function(key, value) { return null }, 
            { out: {inline:1} }).then(function(r){ elem.IDs = _.without(r.map(function(v){ return v._id; }), '_id'); resolve(elem); });
        break;
      default:
        resolve(elem);
        break;
    }
  });
};

// Process One Disease At A Time
var processDisease = function(db, disease){
  return new Promise(function(resolve, reject){
      var promises = disease.sort(function(a,b){ return (a.type<b.type) ? -1 : 1; })
                            .map(function(collection){
                                  return promiseFactory(this, collection.collection, collection.type, disease);
                                }, db);
      Promise.all(promises).then(function(results){
                                  //var diseaseIds = _.union.apply(null, results)
                                  resolve(results);
                                });
    });
}

// Main
var diseases;
console.time();
Promise.all([mongo(mongoose),filestream(fs)]).then(function(response){
    var db = response[0];
    var file = response[1];
    var index = 0;
    console.log(index);
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
        console.log('Finished!');
        console.timeEnd(); // 126372ms without Molecular types; 5083944ms on entire DB 5160 collection Oct 28th
        mongoose.connection.close();
    });
  
});

