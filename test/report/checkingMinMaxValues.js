/* 
  Checking Minmum/Maximum values of each collection or     
*/
console.time();
const mongoose = require('mongoose');
const fs = require("fs");
const u = require("underscore");
const helper = require("../testingHelper.js");
const manifest = require("../manifest_arr.json");
var db, collection;
var elem = {};
var final_result = [];
var ptdegree;
var col;
var values;
var r;
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
  var stream = fs.createWriteStream("./CheckingMinMaxValues.json",{  
        flags: 'w',
        defaultEncoding: 'utf8'
      });
      stream.on("open",function(){
        resolve(stream);
      });
  });
};

var promiseFactory = function(db, collection, type, disease){
    return new Promise(function(resolve, reject){
        var elem = {};
        elem.collection = collection;
        elem.type = type;
        elem.disease = disease;
        elem.MinMax = [];
        type = type.trim().toUpperCase();
        switch(type){
            case "MUT":
            case "MUT01":
            case "METHYLATION":
            case "RNA":
            case "PROTEIN":
            case "CNV":
            case "PSI":  
                console.log(collection);
                var minMax = {};
                db.collection(collection).find().toArray().then(function(res){
                    var r = [];
                    res.forEach(function(gene){
                            var range = u.values(gene.patients).map(function(v){return v.toUpperCase();}).sort();
                            var max = u.last(range);
                            var min = u.first(range);
                            if(min!=gene.min.toUpperCase() || max!=gene.max.toUpperCase()){
                                minMax.gene = gene.gene;
                                minMax.minRecorded = gene.min.toUpperCase();
                                minMax.maxRecorded = gene.max.toUpperCase();
                                minMax.min = min;
                                minMax.max = max;
                                console.log(minMax);
                                r.push(minMax);
                            }
                        });
                    console.log(r.length);
                    elem.MinMax = r;
                    resolve(elem);
                });
               break;
            case "PTDEGREE":
            case "GENEDEGREE":
                console.log(collection);
                var minMax = {};
                db.collection(collection).find().toArray().then(function(res){
                    var r;
                    return r = res.map(function(p){return u.values(u.omit(p,'_id'));});
                }).then(function(){
                    values = u.flatten(r);
                    return values;
                }).then(function(){
                    minMax.min = u.min(values);
                    minMax.max = u.max(values);
                    elem.MinMax.push(minMax);
                    console.log(elem);
                    resolve(elem);
                });
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
    file.write("[");
    asyncLoop(manifest, function(d, next){ 
       promiseFactory(db, d.collection, d.dataType, d.dataset).then(function(res){
          console.log(index++);
          //console.dir(res);
          file.write(JSON.stringify(res, null, 4));
          if(index != manifest.length){
            file.write(",");
          }else{
              file.write("]");
          }
          next();
        });
    }, function (err)
    {
        if (err)
        {
            console.error('Error: ' + err.message);
            return;
        }
        console.log('Finished!');
        console.timeEnd(); // 
    });
  
});
