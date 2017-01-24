const u = require("underscore"); 
const mongoose = require("mongoose");
const jsonfile = require("jsonfile-promised");
const input = require("/usr/local/airflow/docker-airflow/onco-test/dataStr/ajv_test2.json");
const asyncLoop = require('node-async-loop');
const clinicalTypes = ["patient","drug","newTumor","otherMalignancy","radiation","followUp","newTumor-followUp"];
var clinical_input = input.filter(function(m){return (clinicalTypes.indexOf(m.type) > -1);});
var output = [];
var duplicatedFieldsByType = [];
var db;
var connection;

var mongo = function(mongoose){
  return new Promise(function(resolve, reject) {
    connection = mongoose.connect( 
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

// Get Promises Based On Collection Name
var promiseFactory = function(db, collection, type, disease){
  return new Promise(function(resolve, reject){
    var elem = {};
    elem.collection = collection;
    elem.type = type;
    elem.disease = disease;
    console.log(collection);
    var count = 0; 
    elem.IDs = db.collection(collection).mapReduce(
                  function(){ for (var key in this) { emit(key, null); } },
                  function(key, value) { return null }, 
                  { out: {inline:1} }).then(function(r){ elem.IDs = r.map(function(v){ return v._id; });resolve(elem); });
  });
}  

mongo(mongoose).then(function(response){
    db = response;
    var index = 0;
    //console.log(index);
    asyncLoop(clinical_input, function(d, next){ 
      //console.log(d);
      if('collection' in d){
        promiseFactory(db, d.collection, d.type, d.disease).then(function(res){
          //console.log(index++);
          //console.log(res.fieldDuplicates);
          output.push(res);
          //console.log(JSON.stringify(res, null, 4));
          //file.write(JSON.stringify(res, null, 4));
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
        
        output.map(function(m){
          m.potentialDupFields = m.IDs.filter(function(n){return n.match(/[A-Za-z0-9_]+\.[0-9]{1}/g)!=null;});
          return m;
        }); //pull out all the .1 collection fields

        output.filter(function(o){
          var res = o.potentialDupFields.filter(function(str){ return o.IDs.indexOf(str.split(".")[0]) == -1;});
          console.log(res);
          return res.length !=0;
        }); // check if all the core ids exist in the collection fields, otherwise return the .1 name without original core id field
        var groupByType = u.groupBy(output, 'type');
        //groupByType.patient.map(function(m){return m.potentialDupFields;}).reduce(function(a, b){return u.uniq(a.concat(b));});

        duplicatedFieldsByType = Object.keys(groupByType).map(function(k){
          var elem = {};
          elem.type = k;
          elem.affectedDisease = [];
          elem.affectedCollections = [];
          elem.typePotentialDup = groupByType[k].map(function(m){
                                                  if(m.potentialDupFields.length != 0){
                                                    elem.affectedDisease.push(m.disease);
                                                    elem.affectedCollections.push(m.collection);
                                                   } 
                                                  return m.potentialDupFields;
                                                }).reduce(function(a, b){
                                                  return u.uniq(a.concat(b));
                                                });
          return elem;
        });
        jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/duplicatedFields.json", duplicatedFieldsByType, {spaces: 4}, function(err){ console.error(err);}); 
        console.timeEnd(); // 
    });
     db.close();
  });




