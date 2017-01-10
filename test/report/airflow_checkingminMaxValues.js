/* 
  Checking Minmum/Maximum values of each collection or     
*/
console.time();
const mongoose = require('mongoose');
const fs = require("fs");
const u = require("underscore");
//var heapdump = require('heapdump');
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
const manifest = require("/usr/local/airflow/docker-airflow/onco-test/manifest_arr.json");
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
  var stream = fs.createWriteStream("/usr/local/airflow/docker-airflow/onco-test/CheckingMinMaxValues.json",{  
        flags: 'w',
        defaultEncoding: 'utf8'
      });
      stream.on("open",function(){
        resolve(stream);
      });
  });
};

var IN = 1;
var promiseFactory = function(db, d, file){
    
    return new Promise(function(resolve, reject){
        var collection = d.collection;
        var type = d.dataType;
        var disease = d.disease;
        type = type.trim().toUpperCase();
        switch(type){
            case "MUT":
            case "MUT01":
            case "METHYLATION":
            case "RNA":
            case "PROTEIN":
            case "CNV":
            case "PSI": 
                console.log("test", IN++);
                var ind = 0;
                console.log(collection);
                db.collection(collection).find().each(function(err, doc){
                    if(doc != null){
                        var u = doc.patients;
                        var keys = Object.keys(u);
                        var doc_length = keys.length;
                        var max = u[keys[0]];
                        var min = u[keys[0]];        
                        for(var i = 0; i<doc_length; i++){
                            if(typeof(u[keys[i]]) == "string"){
                                if(u[keys[i]].toUpperCase()>max){
                                    max = u[keys[i]];
                                }
                                if(u[keys[i]].toUpperCase()<min){
                                    min = u[keys[i]];
                                }
                            }else{
                                if(u[keys[i]]>max){
                                    max = u[keys[i]];
                                }
                                if(u[keys[i]]<min){
                                    min = u[keys[i]];
                                }
                            }  
                        }
                        if(max != doc.max || min != doc.min) {
                            console.log(ind++);
                            var elem =  {};
                            elem.collection = collection;
                            elem.recordedMax = doc.max;
                            elem.calculatedMax = max;
                            elem.recordedMin = doc.min;
                            elem.calculatedMin = min;
                            file.write(JSON.stringify(elem, null, 4));
                            file.write(",");
                        }   
                    }else{
                        resolve();
                    }
                }); 
                break;
            }
        });
  };

Promise.all([mongo(mongoose),filestream(fs)]).then(function(response){
    var db = response[0];
    var file = response[1];
    var index = 0;
    file.write("[");
    var manifest_molecular = manifest.filter(function(m){
        return m.dataType == "mut" || m.dataType == "methylation" || m.dataType == "rna" || m.dataType == "protein" || m.dataType == "cnv" || m.dataType == "psi";
    });
    asyncLoop(manifest_molecular, function(d, next){ 
        promiseFactory(db, d, file).then(function (err){
                if (err)
                {
                    console.log(err);
                    return;
                }
                next();
            });
        }, function (err){
        if (err)
        {
            console.error('Error: ' + err.message);
            return;
        }
        file.write("]");
        console.log('Finished!');
        console.timeEnd(); // 
    });
  
});
