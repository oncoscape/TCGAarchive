const jsonfile = require("jsonfile-promised");
const u = require("underscore");
const helper = require("../testingHelper.js");
var comongo = require('co-mongodb');
var co = require('co');
var lookupByDisease = [];
var disease_arr = [];
var ptList = {};
var connection = mongoose.connection;
var diseases = [];
var onerror = function(e){
    console.log(e);
};
co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
  lookup_arr = yield collection.find({}).toArray();
  
  lookup_arr.forEach(function(d){
    var ptIDs = [];
    if(('clinical' in d)&&('patient' in d['clinical'])){
      var table = d['clinical']['patient'];
      console.log(table);
      collection = yield comongo.db.collection(db, table);
      var pt = yield collection.find({},{'patient_ID':true}).toArray();
      ptIDs = pt.map(function(v){return v['patient_ID'];});
      ptList[d.disease] = u.uniq(ptIDs);
    }
  });

  // jsonfile.writeFile("ptList.json", ptList, {spaces: 2}, function(err){ console.error(err);});  
  yield comongo.db.close(db);
}).catch(onerror);


