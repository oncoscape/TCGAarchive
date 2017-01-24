const jsonfile = require("jsonfile-promised");
const u = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
const mongoose = require("mongoose");
var lookupByDisease = [];
var disease_arr = [];
var ptList = {};
var connection = mongoose.connection;
var diseases = [];

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
    var db = response;
    var collection = db.collection("lookup_oncoscape_datasources").find();
    lookupByDisease = collection.toArray();
    lookupByDisease.then(function(obj){
        
        return new Promise(function(resolve, reject){
            obj.forEach(function(d){
                var ptIDs = [];
                if(('clinical' in d)&&('patient' in d['clinical'])){
                  console.log(d['clinical']['patient']);
                  var pt = connection.db.collection(d['clinical']['patient']).find({},{'patient_ID':true}).toArray();
                  pt.then(function(value){
                    ptIDs = value.map(function(v){return v['patient_ID'];});
                    ptList[d.disease] = u.uniq(ptIDs);
                 });
                }
              });
            resolve(ptList);
        });
    });
}).then(function(){
    jsonfile.writeFile('/usr/local/airflow/docker-airflow/onco-test/ptIDs/ptList.json', ptList, {spaces:4});
    mongoose.connection.close();
});
