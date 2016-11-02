var mongoose = require("mongoose");
const _ = require("underscore");
const input = require("../datasourceTesting/ajv_tcga_v2_10262016.json");
var asyncLoop = require('node-async-loop');
var db;
var clinicalTypes = ["patient","drug","newTumor","otherMalignancy","radiation","followUp","newTumor-followUp"];
var clinical_input = input.filter(function(m){return (clinicalTypes.indexOf(m.type) > -1);});

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

mongo(mongoose).then(function(response){
    db = response;
    var index = 0;
    console.log(index);
    asyncLoop(clinical_input, function(d, next){ 
      console.log(d);
      if('collection' in d){
        promiseFactory(db, d.collection, d.type, d.disease).then(function(res){
          console.log(index++);
          //console.log(JSON.stringify(res, null, 4));
          file.write(JSON.stringify(res, null, 4));
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
        console.timeEnd(); // 
    });
  });

