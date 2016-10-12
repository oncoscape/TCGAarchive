
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


var comongo = require('co-mongodb');
var co = require('co');
var db, collections, existing_collection_names, manifest;
var manifest_arr = [];
var lookup_table = [];
var lookup_listed_collections = [];
var manifest_listed_collections = [];
var keyFields = [];
var usedFields = ['annotation','location','category','molecular','clinical','calculated','edges'];
var inDBNotInListed = [];
var inListedNotInDB = [];
var collection_counts = [];
var render_pca = [];
var render_patient = [];
var jsonfile = require("jsonfile");
var ajvMsg = [];
var ajvMsg_report = [];
var render_pca_missing_collections = [];
var render_pt_missing_collections = [];

var onerror = function(e){
  console.log(e);
}

jsonfile.readFile('ajv_tcga_v2.json', function(err, obj){ajvMsg = obj;});

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  /*** survey the collections that exist in the tcga database
                                   listed in the lookup_oncoscape_datasources
                                   listed in manifest
   ***/
  var collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
  lookup_table = yield collection.find({}).toArray();
  lookup_table.forEach(function(d){
    keyFields.push(Object.keys(d));
  });
  keyFields = [].concat.apply([], keyFields);
  keyFields = keyFields.unique();
  keyFields = [ '_id','disease','source','beta','annotation','location','category','name','img','rna','molecular','clinical','calculated','edges' ]
  //only iterate 'annotation','location','category','molecular','clinical','calculated','edges'

  lookup_table.forEach(function(d){
    for(var u=0; u<usedFields.length; u++){
      if(usedFields[u] in d){
        if('collection' in d[usedFields[u]]){
          lookup_listed_collections.push(d[usedFields[u]['collection']]);
        }else if(Array.isArray(d[usedFields[u]])){
          var arr = d[usedFields[u]];
          arr.forEach(function(a){
            if('collection' in a){
              lookup_listed_collections.push(a['collection']);
            }else if('edges' in a){
              lookup_listed_collections.push(a['edges']);
            }else if('patientWeights' in a){
              lookup_listed_collections.push(a['patientWeights']);
            }else if('genesWeights' in a){
              lookup_listed_collections.push(a['genesWeights']);
            }else {
              lookup_listed_collections.push(a);
            }
          })
        }
      }
    }
  });//flatten all the collections from lookup_oncoscape_datasources 

  manifest = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield manifest.find({}).toArray();
  manifest_listed_collections = manifest_arr.map(function(m){ return (m.collection);});

  collections = yield comongo.db.collections(db);
  existing_collection_names = collections.map(function(c){
    return c['s']['name'];
  }); //getting the names of all collections

  
  existing_collection_names.forEach(function(c){
    if(lookup_listed_collections.indexOf(c) == -1){
      inDBNotInListed.push(c);
    }
  });

  lookup_listed_collections.forEach(function(l){
    if(existing_collection_names.indexOf(l) == -1){
      inListedNotInDB.push(l);
    }
  });

  format.h2("The number of the collections in database tcga is: ");
  format.text(existing_collection_names.length);
  format.h2("The number listed in lookup_oncoscape_datasources is: "); 
  format.text(lookup_listed_collections.length);
  format.h2("The number listed in manifest is: ");
  format.text(manifest_listed_collections.length);
  format.h2("Compare the existing collections against lookup_listed_collections: ");
  format.codeStart();
  format.text(existing_collection_names.arraysCompare(lookup_listed_collections));
  format.codeStop();
  format.h2("Compare lookup_listed_collections against the existing collections: ");
  format.codeStart();
  format.text(lookup_listed_collections.arraysCompare(existing_collection_names));
  format.codeStop();
  format.h2("Compare the existing collections against manifest_listed_collections: ");
  format.codeStart();
  format.text(existing_collection_names.arraysCompare(manifest_listed_collections));
  format.codeStop();
  format.h2("Compare manifest_listed_collections against the existing collections: ");
  format.codeStart();
  format.text(manifest_listed_collections.arraysCompare(existing_collection_names));
  format.codeStop();
  

  /*** survey the collections that exist in the tcga database
                                   listed in render_pca
                                   listed in render_patient
        
   ***/
  format.h2("Checking rendering collections");
  format.h3("render_pca compare to existing pcascores");
  collection = yield comongo.db.collection(db, 'render_pca');
  render_pca = yield collection.find({},{'disease':true, 'source':true, 'type':true, 'geneset':true}).toArray();
  var pcaScoreTypeMapping = {
    "mutSig2": "mut01",
    "HM27": "methylation-hm27", 
    "RPPA-zscore": "protein",
    "gistic": "cnv", 
    "import":"",
    "gistic2thd": "",
    "mutation": "", 
    "mutationBroadGene": "", 
    "mutationBcmGene": ""
  };
  var existing_pcascores = [];
  var rendering_pca_potential_collections = [];
  existing_collection_names.forEach(function(e){if(e.includes('pcascores') && (!e.includes("-1e+05"))) existing_pcascores.push(e);});

  var pcascores_postfix = []; 
  existing_pcascores.forEach(function(e){pcascores_postfix.push(e.split("-")[e.split("-").length-1]);});
  pcascores_postfix = pcascores_postfix.unique();
  format.text("According to the collection names, there should be listed types in pcascores: ");
  format.codeStart();
  format.text(pcascores_postfix);
  format.codeStop();
  //[ 'mut01', 'cnv', 'hm27', 'protein' ]


  render_pca.forEach(function(r){
    var str = r.disease + "_pcascores_" + r.source + "_prcomp-"+ r.geneset.replace(/ /g, "") + "-" + pcaScoreTypeMapping[r.type] ;
    str = str.toLowerCase();
    rendering_pca_potential_collections.push(str);  
  });
  

  format.h2("Compare the existing collections against render_pca: ");
  format.codeStart();
  format.text(existing_pcascores.arraysCompare(rendering_pca_potential_collections));
  format.codeStop();
  format.h2("Compare render_pca against the existing collections: ");
  format.codeStart();
  format.text(rendering_pca_potential_collections.arraysCompare(existing_pcascores));
  format.codeStop();

  //render_pca_missing_collections.length: 264
  var render_pca_missed_types = render_pca_missing_collections.map(function(r){return r.type;});
  format.text("render_pca doesn't have below types:");
  format.codeStart();
  format.text(render_pca_missed_types.unique());
  format.codeStop();
  // [ 'import',
  // 'gistic2thd',
  // 'mutation',
  // 'mutationBroadGene',
  // 'mutationBcmGene' ]
  format.h3("render_patient compare to existing mds");
  collection = yield comongo.db.collection(db, 'render_patient');
  render_patient = yield collection.find({type:"cluster"}, {'dataset':true, 'type':true, 'name':true, 'source':true}).toArray();
  var existing_mds = [];
  var rendering_pt_potential_collections = [];
  var mdsSourceMapping = {
    "ucsc-pnas": "ucsc",
    "ucsc": "ucsc"
  };
  existing_collection_names.forEach(function(e){if(e.includes('mds') && (!e.includes("-1e+05"))) existing_mds.push(e);});
  render_patient.forEach(function(r){
    if(r.name.includes("mds")){
      var str = r.dataset + "_mds_" + mdsSourceMapping[r.source[0]] + "_mds-"+ r.name.replace(/ /g, "-");
      str = str.toLowerCase();
      rendering_pt_potential_collections.push(str);  
    }
  });
  format.h2("Compare the existing collections against render_patient: ");
  format.codeStart();
  format.text(existing_mds.arraysCompare(rendering_pt_potential_collections));
  format.codeStop();
  format.h2("Compare render_patient against the existing collections: ");
  format.codeStart();
  format.text(rendering_pt_potential_collections.arraysCompare(existing_mds));
  format.codeStop();


  // report the collection erros from ajv_tcga_v2.json 
  
  format.h2("Run the DB against schema_tcga.json, below lists the error message: ");
  format.codeStart();
  ajvMsg.forEach(function(a){
    if(a.passedRate < 1){
      format.text(a);
    }
  });
  format.codeStop();
  // format.codeStart();
  // format.code(ajvMsg_report);
  // format.codeStop();
  yield comongo.db.close(db);
}).catch(onerror);



