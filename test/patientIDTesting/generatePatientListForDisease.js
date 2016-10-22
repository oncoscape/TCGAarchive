var jsonfile = require("jsonfile-promised");
var u = require("underscore");
var collection;
const mongoose = require("mongoose");
var lookupByDisease = [];
var disease_arr = [];
var ptList = {};
Array.prototype.unique = function() {
  var arr = [];
  for(var i = 0; i < this.length; i++) {
      if(arr.indexOf(this[i]) === -1) {
          arr.push(this[i]);
      }
  }
  return arr; 
};

mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var connection = mongoose.connection;
var diseases = [];

connection.once('open', function(){

    lookupByDisease = connection.db.collection("lookup_oncoscape_datasources").find().toArray();

    lookupByDisease.then(function(obj){
      obj.forEach(function(d){
        var ptIDs = [];
        if(('clinical' in d)&&('patient' in d['clinical'])){
          var pt = connection.db.collection(d['clinical']['patient']).find({},{'patient_ID':true}).toArray();
          pt.then(function(value){
            ptIDs = value.map(function(v){return v['patient_ID'];});
            ptList[d.disease] = u.uniq(ptIDs);
          });
        }
      });
    });
    jsonfile.writeFile('ptList.json', ptList, {spaces:4});
   
});
