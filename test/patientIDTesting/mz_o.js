const mongoose = require('mongoose');
const fs = require("fs");
const _ = require("underscore");
const input = require("../collection_counts_10262016.json");

// Connect To Database
var mongo = function(mongoose){
return new Promise(function(resolve, reject) {
var connection = mongoose.connect(
   
'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin', {
       db: { native_parser: true },
       server: { poolSize: 5, reconnectTries: Number.MAX_VALUE },
       replset: { rs_name: 'rs0' },
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

// Get Promises Based On Collection Type
var promiseFactory = function(db, collection, type){
return new Promise(function(resolve, reject){
type = type.trim().toUpperCase();
switch(type){

case "PATIENT":
case "DRUG":
case "NEWTUMOR":
case "OTHERMALIGNANCY":
case "RADIATION":
case "FOLLOWUP":
case "NEWTUMOR-FOLLOWUP":
db.collection(collection).distinct("patient_ID").then(function(r){ resolve(r); });
break;

case "PCASCORES":
case "MDS":
db.collection(collection).mapReduce(
function(){ for (var key in this.data) { emit(key, null); } },
function(key, value) { return null }, 
{ out: {inline:1} }
).then(function(r){ resolve( r.map(function(v){ return v._id; }) ); });
break;

case "MUT":
case "MUT01":
case "METHYLATION":
case "RNA":
case "PROTEIN":
case "CNV":
db.collection(collection).mapReduce(
function(){ for (var key in this.patients) { emit(key, null); } },
function(key, value) { return null }, 
{ out: {inline:1} }
).then(function(r){ resolve( r.map(function(v){ return v._id; }) ); });
break;

default:
resolve([]);
break;
}
});
};

// Process One Disease At A Time
var processDisease = function(db, disease){
return new Promise(function(resolve, reject){
var promises = disease
.sort(function(a,b){ return (a.type<b.type) ? -1 : 1; })
.map(function(collection){
return promiseFactory(this, collection.collection, collection.type);
}, db);
Promise.all(promises).then(function(results){
var diseaseIds = _.union.apply(null, results)
resolve(diseaseIds);
});
});
}

// Main
Promise.all([
mongo(mongoose),
filestream(fs)
]).then(function(response){

var db = response[0];
var file = response[1];

// Loop Through Diseases + Process
var diseases = _.groupBy(input, function(item){ return item.disease; });
var diseaseNames = Object.keys(diseases).splice(0,1);
// Only Process First Two For Test
diseaseNames.forEach(function(diseaseName){
console.log("Processing: " + diseaseName);
processDisease(db, diseases[diseaseName]).then(function(ids){
console.log(ids.join(" + "));
})
})
});