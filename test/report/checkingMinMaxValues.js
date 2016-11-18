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
        var arr = [];
        elem.collection = collection;
        elem.type = type;
        elem.disease = disease;
        type = type.trim().toUpperCase();
        switch(type){
            case "MUT":
            case "MUT01":
            case "METHYLATION":
            case "RNA":
            case "PROTEIN":
            case "CNV":
            case "PSI":  
                var minMax = {};
                arr = [];
                var cursor = db.collection(collection).find();
                var count=0;
                cursor.each(function(err, gene){
                    if(gene != null){
                        var range, max, min;
                        if(typeof(gene.max) == 'string'){
                            // range = u.values(gene.patients).map(function(v){return v.toUpperCase();}).sort();
                            range = u.values(gene.patients).sort();
                            max = u.last(range).toUpperCase();
                            min = u.first(range).toUpperCase();
                            if(min!=gene.min.toUpperCase() || max!=gene.max.toUpperCase()){
                                minMax = {};
                                minMax.gene = gene.gene;
                                minMax.minRecorded = gene.min.toUpperCase();
                                minMax.maxRecorded = gene.max.toUpperCase();
                                minMax.min = min;
                                minMax.max = max;
                                console.log(minMax);
                                arr.push(minMax);
                            }
                        }else{
                            range = u.values(gene.patients).sort();
                            max = u.last(range);
                            min = u.first(range);
                            if(min!=gene.min || max!=gene.max){
                                console.log(count++);
                                minMax = {};
                                minMax.gene = gene.gene;
                                minMax.minRecorded = gene.min;
                                minMax.maxRecorded = gene.max;
                                minMax.min = min;
                                minMax.max = max;
                                console.log(minMax);
                                arr.push(minMax);
                            }
                        }
                    }else{// No more items to process So move to the next table
                        elem.MinMax = arr;
                        console.log(arr.length);
                        resolve(elem);
                    }
                });

            case "PTDEGREE":
            case "GENEDEGREE":
                arr = [];
                var minMax = {};
                db.collection(collection).find().toArray().then(function(res){
                    var r = u.flatten(res.map(function(p){return u.values(u.omit(p,'_id'));}));
                    return r; 
                }).then(function(r){
                    var values = u.flatten(r).sort();
                    minMax = {};
                    minMax.min = u.min(values);
                    minMax.max = u.max(values);
                    arr.push(minMax);
                    elem.MinMax = arr;
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
       console.log(d.collection);  
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
