/* 
  Checking Minmum/Maximum values of each collection or     
*/

var jsonfile = require("jsonfile");
const mongoose = require('mongoose');
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
  var stream = fs.createWriteStream("./output.json",{  
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
        elem.MinMax = {};
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
                    elem.MinMax = res.map(function(gene){
                        minMax.gene = gene.gene;
                        minMax.minRecorded = gene.min;
                        minMax.maxRecorded = gene.max;
                        minMax.min = u.min(u.values(gene.patients));
                        minMax.max = u.max(u.values(gene.patients));
                        return minMax;
                    }).then(function(){resolve(elem);});
                });
               break;
            case "PTDEGREE":
            case "GENEDEGREE":
                console.log(collection);
                var minMax = {};
                db.collection(collection).find().toArray().then(function(res){
                    r = res;
                    //console.log(r);
                    return r = r.map(function(p){return u.values(u.omit(p,'_id'));});
                }).then(function(){
                    values = u.flatten(r);
                    return values;
                }).then(function(){
                    minMax.min = u.min(values);
                    minMax.max = u.max(values);
                    elem.MinMax = minMax;
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
    asyncLoop(manifest, function(d, next){ 
       promiseFactory(db, d.collection, d.dataType, d.dataset).then(function(res){
          console.log(index++);
          file.write(JSON.stringify(res, null, 4));
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
