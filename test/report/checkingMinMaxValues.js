/* 
  Checking Minmum/Maximum values of each collection or     
*/
console.time();
const mongoose = require('mongoose');
const fs = require("fs");
const u = require("underscore");
//var heapdump = require('heapdump');
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
        elem.collection = collection;
        elem.type = type;
        elem.disease = disease;
        var ind = 0;
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
                db.collection(collection).find().each(function(err, doc){
                    //console.log(Object.keys(doc.patients).length);
                    if(doc != null){
                        var u = doc.patients;
                        var max = "";
                        var min = "";
                        var keys = Object.keys(u);
                        var doc_length = keys.length;
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
                        //console.log(ind++);
                        // if(max != doc.max || min != doc.min) {
                        //     console.log(collection);
                        //     console.log("recorded max is:", doc.max);
                        //     console.log("calculated max is:", max);
                        //     console.log("recorded min is:", doc.min);
                        //     console.log("calculated min is:", min);
                        // }    
                    }
                    });            
                resolve(elem);
                break;
            // case "PTDEGREE":
            // case "GENEDEGREE":
            //     var minMax = {};
            //     db.collection(collection).find().toArray().then(function(res){
            //         var r = u.flatten(res.map(function(p){return u.values(u.omit(p,'_id'));}));
            //         return r; 
            //     }).then(function(r){
            //         var values = u.flatten(r).sort();
            //         minMax = {};
            //         minMax.min = u.min(values);
            //         minMax.max = u.max(values);
            //         elem.MinMax = minMax;
            //         resolve(elem);
            //     });
            //     break;
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
       //console.log(d.collection);  
       promiseFactory(db, d.collection, d.dataType, d.dataset).then(function(res){
        //   console.log(index++);
        //   file.write(JSON.stringify(res, null, 4));
        //   if(index != manifest.length){
        //     file.write(",");
        //   }else{
        //       file.write("]");
        //   }
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
