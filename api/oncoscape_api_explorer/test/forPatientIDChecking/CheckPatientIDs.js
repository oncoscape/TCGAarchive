Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.arraysCompare = function(ref) {
    var elem = {};
    elem.countInRef = 0;
    elem.itemsNotInRef = [];
    for(var i = 0; i < this.length; i++) {
        if(ref.indexOf(this[i]) > -1){
          elem.countInRef++;
        }else{
          elem.itemsNotInRef.push(this[i]);
        }
    }
    return elem;
};

Object.prototype.nestedUniqueCount = function(){
    var errorCount = {};
    var ar = [];
    var str;
    this['errors'].forEach(function(a){
        a.errorType.forEach(function(e){
          str = e.schemaPath + " [message: "+ e.message + "]; Number of Violation: ";  
          if(ar.contains(str)){
            errorCount[str]++;
          }else{
            ar.push(str);
            errorCount[str]=1;
          }
        });
    });
    //return ar.unique();
    return errorCount;
};

Array.prototype.arraysCompareV2 = function(ref) {
    var elem = {};
    elem.overlapCount = 0;
    elem.itemsNotInRef = [];
    elem.refItemsNotInSelf = [];
    for(var i = 0; i < this.length; i++) {
        if(ref.indexOf(this[i]) > -1){
          elem.countInRef++;
        }else{
          elem.itemsNotInRef.push(this[i]);
        }
    }
    for(var j = 0; j < ref.length; j++){
        if(this.indexOf(ref[j]) == -1){
          elem.refItemsNotInSelf.push(ref[j]);
        }
    }
    return elem;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(arr.indexOf(this[i]) === -1) {
            arr.push(this[i]);
        }
    }
    return arr; 
};

Array.prototype.findTypeByCollection = function(v){
  for(var i = 0; i < this.length; i++) {
    if(this[i].collection === v){
      //console.log(this[i].collection);
      //return this[i].dataType;
      return this[i].dataType;
    } 
  }
  return false;
};

Array.prototype.findCollectionsByDisease = function(d){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].disease === d){
      arr.push(this[i]);
    } 
  }
  return arr;
};

Array.prototype.findScoreByDiseaseByType = function(t, d) {
  var passedRateArray = [];
  this.forEach(function(a){
    if(a.type==t && a.disease==d) 
      passedRateArray.push(a.passedRate);
  });
  return passedRateArray;
};

Array.prototype.findCollectionsByType = function(v){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].type === v){
      arr.push(this[i].collection);
    } 
  }
  return arr;
};

Array.prototype.findObjsByType = function(v){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].type === v){
      arr.push(this[i]);
    } 
  }
  return arr;
};

Array.prototype.table = function(uniqueArray) {
    var elem = {};
    uniqueArray.forEach(function(u){
        elem[u] = 0;
    });
    for(var i = 0; i < this.length; i++){
        if(uniqueArray.indexOf(this[i]['errorType']) > -1){
            elem[this[i]['errorType']]++;
        }
    }
    return elem;

};

Object.prototype.nestedUnique = function(){
    var ar = [];
    this['errors'].forEach(function(a){
        ar.push(a['errorType']);
    });
    return ar.unique();
};

var format = {
  h1: function(text) { console.log(); console.log('# '+text); },
  h2: function(text) { console.log(); console.log('## '+text); },
  h3: function(text) { console.log(); console.log('### '+text); },
  h4: function(text) { console.log(); console.log('#### '+text); },
  textbold: function(text) { console.log(); console.log(); console.log('**'+ text+'**'); },
  textlist: function(text){ console.log(); console.log('- '+ text);  },
  textsublist: function(text){ console.log('  * '+ text);  },
  text: function(text){ console.log(); console.log(text);  },
  url: function(text) {console.log(); console.log('`' + text + '`'); console.log();},
  codeStart: function() { console.log(); console.log('```'); },
  codeComment: function(text) {console.log(); console.log('> ' + text); console.log(); },
  codeStop: function() {console.log('```');  console.log(); },
  code: function(text) { console.log('"'+ text + '"'); },
  jsonfy: function(text) { console.log('{' + text + '}');},
  codeRStart: function(text) {  console.log(); console.log("```r");},
  codeMongoStart: function(text) {  console.log(); console.log("```shell"); },
  codeJSStart: function(text) {  console.log(); console.log("```javascript"); },
  codePyStart: function(text) {  console.log(); console.log("```python"); },
  codeJSONStart: function(text) {  console.log(); console.log("```json"); },
  table: function(text){ console.log(text);  }
};


/* 
This is the code to check patient IDs throughout the entire database
requires: mongoose
          ptList.json
          ajv_10202016_v2.json
Purposes
        - substratify the entire DB by datatype and 
          and run schemas.json ajv validation on each collection 
          error message at the document level will be reported
*/

var jsonfile = require("jsonfile-promised");
var asyncLoop = require('node-async-loop');
const mongoose = require("mongoose");
var ajvMsg, collection, schemas, ptList;

jsonfile.readFile("../datasourceTesting/ptList.json").then(function(obj){
  ptList = obj;
});

jsonfile.readFile("../datasourceTesting/ajv_tcga_v2_10182016.json").then(function(obj){
  ajvMsg = obj;
});

jsonfile.readFile("../schemas.json").then(function(obj){
  schemas = obj;
});

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
var status = [];
connection.once('open', function(){
    var db = connection.db; 
    var index = 0;
    var ajvMsg_length = ajvMsg.length;


    
    /* This section theoretically runs throughout the entire DB, but will cause memory leak
     */

    var processNextCollection = function(d){
        var tableName = d.collection;
        var t = d.type;
        var collection = db.collection(tableName);
        var cursor = collection.find();
        var elem = d;
        elem.ptIDStatus = [];
        var count = 0;
        if(["mut", "mut01", "methylation", "rna", "protein", "cnv"].indexOf(t) > -1){
          console.log('within molecular');
          cursor.each(function(err, item){
            if(item != null){
              console.log(count++);
              var evaluation = Object.keys(item.patients).arraysCompare(ptList[d.disease]);
              if(evaluation.itemsNotInRef.length != 0){
                  elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
              }
            }
          });
          cursor = null;
          collection = null;
          return elem;
        }else
        if(t == "color"){
          console.log('within color');
          cursor.each(function(err, item){
            if(item != null){
              item.data.forEach(function(e){
                console.log(count++);
                var evaluation = e.values.arraysCompare(ptList[d.disease]);
                if(evaluation.itemsNotInRef.length != 0){
                  elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
                }
              });
            }
          });
          cursor = null;
          collection = null;
          return elem;
        }
        else if(t == "events"){
          console.log("within events");
          cursor.each(function(err, item){
            if(item != null){
              console.log(count++);
              var evaluation = Object.keys(item).arraysCompare(ptList[d.disease]);
              if(evaluation.itemsNotInRef.length != 0){
                elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
              }
            }
          });
          cursor = null;
          collection = null;
          return elem;
        }
        else if(["patient", "drug", "newTumor", "otherMalignancy", "radiation", "followUp", "newTumor-followUp"].indexOf(t) > -1){
          console.log("within clinical");
          console.log(count++);
  
          collection.distinct('patient_ID').then(function(ids){
            var evaluation = ids.arraysCompare(ptList[d.disease]);
            if(evaluation.itemsNotInRef.length != 0){
              elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
            }
    
          });
          cursor = null;
          collection = null;
          return elem;
        }
        else if(["pcaScores", "mds"].indexOf(t) > -1){
          console.log("within pcaScores or mds");
          cursor.each(function(err, item){
            console.log(count++);
            if(item != null){
              var evaluation = Object.keys(item.data).arraysCompare(ptList[d.disease]);
              if(evaluation.itemsNotInRef.length != 0){
                elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
              }
            }
          }); 
          cursor = null;
          collection = null;
          return elem;
        }
        else if(t == "edges"){
          console.log("within edges");
          console.log(count++);
          collection.distinct('p').then(function(ids){
            var evaluation = ids.arraysCompare(ptList[d.disease]);
            if(evaluation.itemsNotInRef.length != 0){
              elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
            }
          });
          cursor = null;
          collection = null;
          return elem;
        }
        else if(t == "ptDegree"){
          console.log("within ptDegree");
          cursor.each(function(err, item){
            console.log(count++);
            if(item != null){
              if(ptList[d.disease].indexOf(Object.keys(item)[1]) != -1)
                elem.ptIDStatus.push(Object.keys(item)[1]);
            }
          });
          cursor = null;
          collection = null;
          return elem;
        }
        else{
          console.log("&&&& THIS TYPE IS NOT INCLUDES: ", t);
          index += 1;
          cursor = null;
          collection = null;
          return false;
        }
        
      };
    
    for(var i=0; i<ajvMsg.length; i++){
        console.log(ajvMsg[i].collection);
        status.push(processNextCollection(ajvMsg[i]));
    }
    //setTimeout(function(){ jsonfile.writeFile("test3.json", status, {spaces: 4}, function(err){ console.error(err);}); }, 70);
    jsonfile.writeFile("test2.json", status, {spaces: 4}, function(err){ console.error(err);}); 
    
    asyncLoop(ajvMsg, function(d, next){  
      console.log("*************", d.collection);

      if(ptList[d.disease] != 0){
        status.push(processNextCollection(d));
      }
        next();
      
    }, function (err)
    {
        if (err)
        {
            console.error('Error: ' + err.message);
            return;
        }
        console.timeEnd();
        //jsonfile.writeFile("status_ptIDs_10212016.json", status, {spaces: 4}, function(err){ console.error(err);}); 
        console.log('Finished!');
    });

});
jsonfile.writeFile("test2.json", status, {spaces: 4}, function(err){ console.error(err);}); 


    
/* Re-organize the result */
var jsonfile = require("jsonfile-promised");
var status = [];
jsonfile.readFile("test2.json").then(function(res){status=res;}); 
var tested = status.filter(function(s){return s!=false;}); //4010
var test2 = tested.map(function(t){
    var elem = {};
    elem.collection = t.collection;
    elem.disease = t.disease;
    elem.passedCounts = t.passedCounts;
    elem.totalCounts = t.totalCounts;
    elem.passedRate = t.passedRate;
    elem.dataStructuralError = t.errorMessage;
    elem.ptIDErrorCounts = t.ptIDStatus.length;
    return elem;
}).sort(function(a, b){
    return b.ptIDErrorCounts - b.ptIDErrorCounts;
});

test2.filter(function(t){return t.ptIDErrorCounts==0;}).length; //1909 colllections do not include any ptID errors


var uniqueTypes = tested.map(function(p){return p.type;}).unique();
var uniqueDiseases = tested.map(function(p){return p.disease;}).unique();

var status_byDbyT = [];
for(var i=0;i<uniqueDiseases.length;i++){
    for(var j=0; j<uniqueTypes.length;j++){
        var elem = {};
        var ptIDs = [];
        var arr = tested.findObjByDiseaseByType(uniqueTypes[j], uniqueDiseases[i]);
        arr.forEach(function(a){
            ptIDs = ptIDs.concat(a.ptIDStatus).unique();
        });
        elem.disease = uniqueDiseases[i];
        elem.type = uniqueTypes[j];
        elem.ptIDClinicalCounts = ptList[uniqueDiseases[i]].length;
        elem.IDnotInPtCounts = ptIDs.length;
        status_byDbyT.push(elem);
    }
}

var status_DTS = status_byDbyT.sort(function(a,b){return a.IDnotInPtCounts - b.IDnotInPtCounts;});

jsonfile.writeFile("patientIDsErrorCountsByDiseaseByType.json", status_DTS, {spaces:4});


var diseasesWithPIDErros = status_DTS.filter(function(s){return s.IDnotInPtCounts >0;}).map(function(s){return s.disease;}).unique();
// These disease types have patient ID errors
// [ 'lgg','brca','brain','lusc','hnsc','kirp','luad','gbm','thca','read',
//   'thym','sarc','pcpg','kirc','coad','ov','paad','cesc','chol','esca',
//   'tgct','blca','ucec','kich','stad','dlbc','lihc','prad','acc','laml',
//   'coadread','skcm','lung' ]
diseasesWithPIDErros.arraysCompareV2(uniqueDiseases)
// { overlapCount: 0,
//   itemsNotInRef: [],
//   refItemsNotInSelf: [ 'uvm', 'meso', 'ucs' ],
//   countInRef: NaN }

var typesWithPIDErros = status_DTS.filter(function(s){return s.IDnotInPtCounts >0;}).map(function(s){return s.type;}).unique();
// These data types have patient ID errors
// [ 'cnv','protein','events','mut','mds','mut01','edges','otherMalignancy',
//   'pcaScores','methylation','rna','color','ptDegree' ]
typesWithPIDErros.arraysCompareV2(uniqueTypes);
// { overlapCount: 0,
//   itemsNotInRef: [],
//   refItemsNotInSelf: 
//    [ 'radiation',
//      'patient',
//      'drug',
//      'newTumor',
//      'followUp',
//      'newTumor-followUp' ],
//   countInRef: NaN }
