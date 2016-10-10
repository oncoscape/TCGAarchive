var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
var assert = require('assert');
var Ajv = require('ajv');
var ajv = new Ajv();

var onerror = function(e){
  console.log(e);
}

ajv.addFormat('tcga_id', /TCGA-\w{2}-\w{4}-\w{2}/);

var tool_schemas = {
    "Patient_History":{
           "patient":{
            "properties":{
               "patient_ID": {"type": "string", "format": "tcga_id" },
               "days_to_birth": {"type": "integer"},
               "diagnosis_year": {"type": "integer"}
              },
            "required": ["patient_ID","days_to_birth","diagnosis_year"],
            "additionalProperties": true  
            }
    },
    "Timelines":{
           "patient":{
            "properties":{
               "patient_ID": {"type": "string", "format": "tcga_id" },
               "days_to_birth": {"type": "integer"},
               "diagnosis_year": {"type": "integer"}
               },
            "required": ["patient_ID","days_to_birth","diagnosis_year"],
            "additionalProperties": true  
          },
          "drug":{
            "properties":{
               "patient_ID": {"type": "string", "format": "tcga_id" },
            },
            "required": ["patient_ID"],
            "additionalProperties": true  
          },  
          "radiation":{
            "properties":{
               "patient_ID": {"type": "string", "format": "tcga_id" },
             },
            "required": ["patient_ID"],
            "additionalProperties": true  
            }
      }
  };
 
Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
};

function elem_processing(elem){
    var k = elem.map(function(e){
      return Object.keys(e);
    });
    var kk = [].concat.apply([], k);

    var values = [];
    elem.forEach(function(e){ values.push(e[Object.keys(e)]);});

    var value_length = values.length;
    var unique_values = [];
    for(var i=0;i<value_length;i++){
      if(unique_values.indexOf(values[i]) == -1){
        unique_values.push(values[i]);
      }
    }

    var elem2 = {};
    for(var j=0;j<unique_values.length;j++){
      elem2[unique_values[j]] = [];
    }

    for(var i=0;i<value_length;i++){
      for(var j=0;j<unique_values.length;j++){
        if(values[i] == unique_values[j]){
          elem2[unique_values[j]].push(kk[i]);
        }
      }
    }
    var elem3 = {};
    for(j=0;j<unique_values.length;j++){
      elem3[unique_values[j]] = elem2[unique_values[j]].length;
    }
    return elem3;
}

var schemaFactory = function(schema){

  var _schema = schema;

  var getSchema = function() { return _schema; }
  var getToolNames = function() {return Object.keys(_schema); }
  var getToolByName = function(name) { return _schema[name]; }
  var getKeysByName = function(name) { return Object.keys(_schema[name]); }

  return{
    getSchema : getSchema,
    getToolNames  : getToolNames,
    getToolByName : getToolByName,
    getKeysByName : getKeysByName
  }
}

var msgFactory = function(ajvMsgObject){
  var _msg = ajvMsgObject;

  var getMsgByDisease = function (disease) { 
    for(var i = 0; i < _msg.length; i++) {
          if(_msg[i]['disease'] === disease) 
            return _msg[i];
    }
  }
  
  var getMsgByDiseaseByTool = function (disease, tool) { 
    for(var i = 0; i < _msg.length; i++) {
          if(_msg[i]['disease'] === disease) 
            return _msg[i][tool];
      }
  }

  var validationByDiseaseByTool = function (disease, tool) { 
    var diseaseToolMsg = {};
    var pass = true; 
    for(var i = 0; i < _msg.length; i++) {
          if(_msg[i]['disease'] === disease) 
            diseaseToolMsg = _msg[i][tool];
    }

    var BreakException= {};

    try {
        Object.keys(diseaseToolMsg).forEach(function(key){
          if(diseaseToolMsg[key].passedPercentage < 50){
            pass = false;
            throw BreakException;
          }  
        });
    } catch(e) {
        if (e!==BreakException) throw e;
    }


    
    if(pass === true) {
      return (tool + " can be applied to " + disease);
    } else {
      return (tool + " can NOT be applied to " + disease);
    }
  }

  return {
    getMsgByDisease : getMsgByDisease,
    getMsgByDiseaseByTool : getMsgByDiseaseByTool,
    validationByDiseaseByTool : validationByDiseaseByTool
  }
}

// var databaseFactory = function(){
//   var db, collection, disease_tables;

//   co(function *() {

//     db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
//       '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
//       'oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');
//     var str = 'lookup_oncoscape_datasources';
//     var getCollection = function(collection) {
//       collection = yield comongo.db.collection(db, str);
//       disease_tables = yield collection.find({}).toArray();
//       return disease_tables;
//     }
//     yield comongo.db.close(db);
//   }).catch(onerror);

//   return {
//     db:db,
//     getCollection: getCollection
//   };

// };


// var myDb = databaseFactory();

// myDb.diseaseTables




var ajvMsg = [];
var disease_tables = [];
var disease_collections = {};
var passed_elem = [];
var error_elem = [];
var elem = [];
var elem2 = [];
var msg = {};
var msg_tool = {};
var db, collection,db_collections;
var diseases = [];
var listed_collections = [];
var tool_names = [];
var disease_tables_length;
var tool_names_length;
var tool;      
var tool_tbls_required = [];
var tool_tbls_required_length;
var tbl = {};
var tbl_doc = [];
var new_disease_tables = [];         


co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');
  collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
  disease_tables = yield collection.find({}).toArray();

  /* currently, only focus on clinical collections; 
   * in future, this section needs to be expanded to include molecular collections
   */

  disease_tables.forEach(function(doc){
    console.log(doc.disease);
    if(Object.keys(doc).indexOf("clinical") != -1){
      new_disease_tables.push(doc);
      diseases.push(doc.disease);
      Object.keys(doc.clinical).forEach(function(key){
        listed_collections.push(doc.clinical[key]);
      });
    }
  });
  

  // Checks that the # of collections matches DB Stats
  //console.log("Listed Collections: ", listed_collections.length);
  //var db_stats = yield comongo.db.stats(db);
  //console.dir(db_stats["collections"]);
  //assert.ok((db_stats["collections"] > listed_collections.length));

  //db_collections = yield comongo.db.collectionNames(db);
  //console.log(db_collections);
  // tool-dependent collection validations
  tool_names = Object.keys(tool_schemas);
  disease_tables_length = disease_tables.length;
  
  tool_names_length = tool_names.length;

  for(var i=0;i<diseases.length;i++){
    msg = {};
    msg["disease"] = diseases[i]; 
    console.log(msg);
    disease_collections = new_disease_tables[i].clinical;
    console.log(Object.keys(disease_collections));
    
    for(var j=0;j<tool_names_length;j++){
      msg_tool = {};
      tool = schemaFactory(tool_schemas).getToolNames()[j];
      tool_tbls_required = schemaFactory(tool_schemas).getKeysByName(tool);
      tool_tbls_required_length = tool_tbls_required.length;

      for(var m=0;m<tool_tbls_required_length;m++){
        if(Object.keys(disease_collections).indexOf(tool_tbls_required[m]) != -1){
          tbl = yield comongo.db.collection(db, disease_collections[tool_tbls_required[m]]);
          tbl_doc = yield tbl.find({}).toArray();
          console.log(tbl_doc.length);
          passed_elem = [];
          error_elem = [];
          elem = {};

          tbl_doc.forEach(function(d){
            var v = ajv.validate(tool_schemas[tool][tool_tbls_required[m]],d);
            if(!v){
              var e = {};
              var id = d.patient_ID;
              e[id] = ajv.errors[0].schemaPath + " " + ajv.errors[0].message;
              error_elem.push(e);
            }else{
              passed_elem.push(d.patient_ID);
            };           
          });
          elem2 = elem_processing(error_elem);
          console.log("passed elements length is: ");
          console.log(passed_elem.length);
          console.log("error elements length is: ");
          console.log(error_elem.length);
          elem['count'] = tbl_doc.length; 
          //elem['passed'] = passed_elem;
          var rate = passed_elem.length/tbl_doc.length;
          elem['passedPercentage'] = rate.toFixed(4) * 100;
          elem['error'] = elem2;
          //elem['error'] = error_elem;
          msg_tool[tool_tbls_required[m]] = elem;
        }else{
          msg_tool[tool_tbls_required[m]] = "Disease does not have this Collection";
        }

      }
      msg[tool] = msg_tool;
     }
    ajvMsg.push(msg);
    
  }
  
  yield comongo.db.close(db);
}).catch(onerror);

jsonfile.writeFile("ajvMsg.json", ajvMsg, {spaces: 2}, function(err){ console.error(err);});
jsonfile.writeFile("tool_schemas.json", tool_schemas, {spaces: 2},  function(err){ console.error(err);});
  

