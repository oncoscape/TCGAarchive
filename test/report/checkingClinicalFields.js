var mongoose = require("mongoose");
const u = require("underscore");
const input = require("../datasourceTesting/ajv_tcga_v2_10262016.json");
var asyncLoop = require('node-async-loop');
var db;
var clinicalTypes = ["patient","drug","newTumor","otherMalignancy","radiation","followUp","newTumor-followUp"];
var clinical_input = input.filter(function(m){return (clinicalTypes.indexOf(m.type) > -1);});
var output = [];

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

// Get Promises Based On Collection Name
var promiseFactory = function(db, collection, type, disease){
  return new Promise(function(resolve, reject){
    var elem = {};
    elem.collection = collection;
    elem.type = type;
    elem.disease = disease;
    elem.fieldDuplicates = [];
    console.log(collection);
    var count = 0; 
    var cursor = db.collection(collection).find();
    cursor.each(function(err, item){
        if(item != null){
          //console.log(count++);
          var dup =[];
          var dupObj = u.countBy(Object.keys(item));
          //console.log(dupObj);
          Object.keys(dupObj).forEach(function(el){
            //console.log(el);
            if(dupObj[el] > 1) dup.push(el);});
          // console.log(dup);
          //.filter(function(m){return m>1;});
          //if(dup.length > 0){
            elem.fieldDuplicates = elem.fieldDuplicates.concat(dup);
          //}
        }else{
         resolve(elem);
        }
      });
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
          console.log(res.fieldDuplicates);
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
        console.log("The Result of Checking Duplicated Fields in all Clinical Collections is: ");
        console.log(output.filter(function(m){return m.fieldDuplicates.length > 0 ;}));

        console.timeEnd(); // 
    });
  });


