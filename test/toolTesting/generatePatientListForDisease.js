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

    lookupByDisease = connection.db.collection("lookup_oncoscape_datasources").find();
    lookupByDisease.each(function(err, item){
          if(item != null){
            console.log(item['disease']);
            diseases.push(item['disease']);
            disease_arr.push(item);
          }     
    }); 
    console.log("test0");
    disease_arr.forEach(function(d){
      console.log("test1");
      var ptIDs = [];
      if(('clinical' in d)&&('patient' in d['clinical'])){
        var pt = connection.db.collection(d['clinical']['patient']).find({},{'patient_ID':true});
        pt.each(function(err, item){
          if(item != null)
          ptIDs.push(item['patient_ID']);
        });
      }
      ptList[d.disease] = ptIDs;
    });

    console.log("test2");
    Object.keys(ptList).forEach(function(k){
      console.log("test3");
       ptList[k] = u.uniq(ptList[k]);
    });
    console.log("test4");
    jsonfile.writeFile('ptList.json', ptList, {spaces:4});
   
});
