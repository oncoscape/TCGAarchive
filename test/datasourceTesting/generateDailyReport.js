
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
    elem.itemsNotInRef = elem.itemsNotInRef.sort();
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
var jsonfile = require("jsonfile-promised");
var ajvMsg = [];
var ajvMsg_report = [];
var render_pca_missing_collections = [];
var render_pt_missing_collections = [];
var patientIDs_status=[], patientID_errors = [];

var onerror = function(e){
  console.log(e);
}

jsonfile.readFile('ajv_tcga_v2.json').then(function(res){ajvMsg =res;});

// jsonfile.readFile("patientID_errors.json", function(obj, err){
//   patientIDs_status = obj;
// });
var patientIDs_status, patientID_errors;
var cnv_p, meth_p, mut01_p, mut_p, rna_p, prot_p, woMol_p;
jsonfile.readFile("../report/patientIDstatus_meth_10152016.json").then(function(res){meth_p =res;});
jsonfile.readFile("../report/patientIDstatus_mut01_10152016.json").then(function(res){mut01_p =res;});
jsonfile.readFile("../report/patientIDstatus_cnv_10152016.json").then(function(res){cnv_p =res;});
jsonfile.readFile("../report/patientIDstatus_mut01_10152016.json").then(function(res){mut01_p =res;});
jsonfile.readFile("../report/patientIDstatus_rna_10152016.json").then(function(res){rna_p =res;});
jsonfile.readFile("../report/patientIDstatus_mut_10152016.json").then(function(res){mut_p =res;});
jsonfile.readFile("../report/patientIDstatus_protein_10152016.json").then(function(res){prot_p =res;});
jsonfile.readFile("../report/patientIDstatus_woMol_10142016.json").then(function(res){woMol_p =res;});


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
        if(usedFields[u] == 'clinical'){
          var obj = d['clinical'];
          Object.keys(obj).forEach(function(k){
            lookup_listed_collections.push(obj[k]);
          });
        }else if('collection' in d[usedFields[u]]){
          lookup_listed_collections.push(d[usedFields[u]['collection']]);
        }else if(Array.isArray(d[usedFields[u]])){
          var arr = d[usedFields[u]];
          arr.forEach(function(a){
            if('collection' in a){
              lookup_listed_collections.push(a['collection']);
            }else if('edges' in a){
              lookup_listed_collections.push(a['edges']);
              lookup_listed_collections.push(a['patientWeights']);
              lookup_listed_collections.push(a['genesWeights']);
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
  format.h1("Part I: Checking existing collections against lookup_oncoscape_datasources and manifest files");
  format.h3("The number of the collections in database tcga is: ");
  format.text(existing_collection_names.length);
  format.h3("The number listed in lookup_oncoscape_datasources is: "); 
  format.text(lookup_listed_collections.length);
  format.h3("The number listed in manifest is: ");
  format.text(manifest_listed_collections.length);
  format.h3("Compare the existing collections against lookup_listed_collections: ");
  format.codeStart();
  format.text(existing_collection_names.arraysCompare(lookup_listed_collections));
  format.codeStop();
  format.h3("Compare lookup_listed_collections against the existing collections: ");
  format.codeStart();
  format.text(lookup_listed_collections.arraysCompare(existing_collection_names));
  format.codeStop();
  format.h3("Compare the existing collections against manifest_listed_collections: ");
  format.codeStart();
  format.text(existing_collection_names.arraysCompare(manifest_listed_collections));
  format.codeStop();
  format.h3("Compare manifest_listed_collections against the existing collections: ");
  format.codeStart();
  format.text(manifest_listed_collections.arraysCompare(existing_collection_names));
  format.codeStop();
  

  /*** survey the collections that exist in the tcga database
                                   listed in render_pca
                                   listed in render_patient
        
   ***/
  format.h1("Part II: Checking rendering collections");
  format.h3("render_pca compare to existing pcascores");
  collection = yield comongo.db.collection(db, 'render_pca');
  render_pca = yield collection.find({},{'disease':true, 'source':true, 'type':true, 'geneset':true}).toArray();
  var pcaScoreTypeMapping = {
    "mutSig2": "mut01",
    "HM27": "methylation-hm27", 
    "RPPA-zscore": "protein",
    "gistic": "cnv", 
    "import":"mut01",
    "gistic2thd": "cnv",
    "mutation": "mut01", 
    "mutationBroadGene": "mut01", 
    "mutationBcmGene": "mut01"
  };
  var existing_pcascores = [];
  var rendering_pca_potential_collections = [];
  existing_collection_names.forEach(function(e){if(e.includes('pcascores') && (!e.includes("-1e+05"))) existing_pcascores.push(e);});

  var pcascores_postfix = []; 
  existing_pcascores.forEach(function(e){pcascores_postfix.push(e.split("-")[e.split("-").length-1]);});
  pcascores_postfix = pcascores_postfix.unique();
  format.text("Mapping from render_pca type to the pcascores name postfix:");
  format.codeStart();
  format.text(pcaScoreTypeMapping);
  format.codeStop();
  format.text("From the pcaScores collection names, the existing types lists below: ");
  format.codeStart();
  format.text(pcascores_postfix);
  format.codeStop();
  //render_pca_missing_collections.length: 264
  var render_pca_missed_types = render_pca_missing_collections.map(function(r){return r.type;});
  format.text("Are there any types that render_pca doesn't include? :");
  format.codeStart();
  format.text(render_pca_missed_types.unique());
  format.codeStop();
  // [ 'import',
  // 'gistic2thd',
  // 'mutation',
  // 'mutationBroadGene',
  // 'mutationBcmGene' ]
  //[ 'mut01', 'cnv', 'hm27', 'protein' ]


  render_pca.forEach(function(r){
    var str = r.disease + "_pcascores_" + r.source + "_prcomp-"+ r.geneset.replace(/ /g, "") + "-" + pcaScoreTypeMapping[r.type] ;
    str = str.toLowerCase();
    rendering_pca_potential_collections.push(str);  
  });
  

  format.h3("Compare the existing collections against render_pca: ");
  format.codeStart();
  format.text(existing_pcascores.arraysCompare(rendering_pca_potential_collections));
  format.codeStop();
  format.h3("Compare render_pca against the existing collections: ");
  format.codeStart();
  format.text(rendering_pca_potential_collections.arraysCompare(existing_pcascores));
  format.codeStop();

  
  format.h2("render_patient compare to existing mds");
  collection = yield comongo.db.collection(db, 'render_patient');
  render_patient = yield collection.find({type:"cluster"}, {'dataset':true, 'type':true, 'name':true, 'source':true}).toArray();
  var existing_mds = [];
  var rendering_pt_potential_collections = [];
  // var mdsSourceMapping = {
  //   "ucsc-pnas": "ucsc",
  //   "ucsc": "ucsc"
  // };
  existing_collection_names.forEach(function(e){if(e.includes('mds') && (!e.includes("-1e+05"))) existing_mds.push(e);});
  render_patient.forEach(function(r){
    if(r.name.includes("mds")){
      var str;
      if(Array.isArray(r.source)){
        str = r.dataset + "_mds_" + r.source[0] + "_" + r.name.replace(/ /g, "");
      }else{
        str = r.dataset + "_mds_" + r.source + "_" + r.name.replace(/ /g, "");
      }
      
      str = str.toLowerCase();
      rendering_pt_potential_collections.push(str);  
    }
  });

  var render_patient_weird_ex = {
    // "_id" : ObjectId("57dc4bf961f0f92bdd372afb"),
    "type" : "cluster",
    "name" : "pca-OSCC Chen 9 genes-mut01",
    "source" : "broad"
  };

  format.h3("Compare the existing collections against render_patient: ");
  format.codeStart();
  format.text(existing_mds.arraysCompare(rendering_pt_potential_collections));
  format.codeStop();
  format.h3("Compare render_patient against the existing collections: ");
  format.codeStart();
  format.text(rendering_pt_potential_collections.arraysCompare(existing_mds));
  format.codeComment("In render_patient, there are documents with 'cluster' as type, yet 'pca-' as name prefix.");
  format.text(render_patient_weird_ex);
  format.codeStop();


  // report the collection erros from ajv_tcga_v2.json 
  
  format.h1("Part III: Run the DB against schema_tcga.json, below lists the error message: ");
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

  // report the earlier version patient ID checking


  patientID_errors = cnv_p.concat(meth_p, mut01_p, mut_p, rna_p, meth_p, woMol_p);
  jsonfile.writeFile("patientID_errors.json", patientID_errors, {spaces:4});
  patientID_errors = patientID_errors.filter(function(p){return (p.ptIDStatus.length >0);});

  patientID_errors.sort(function(a, b){
    return b.ptIDStatus.length - a.ptIDStatus.length;
  });
  var dis = patientID_errors.map(function(p){return ("Error Counts: " + p.ptIDStatus.length + " [Details: " +p.disease + " "+  p.type + " "+ p.collection + "]");});
  
  format.h1("Part IV: Checked the patient IDs against disease patient collection IDs:");
  format.codeStart();
  format.text(dis);
  format.codeStop();

  yield comongo.db.close(db);
}).catch(onerror);



