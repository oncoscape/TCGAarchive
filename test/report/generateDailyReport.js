
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

Array.prototype.containPartialString = function(regex){
   var arr = [];
   for(var i = 0; i< this.length; i++){
     if(this[i].match(regex) != null ){
      arr = arr.concat(this[i]);
     }
   }
   return arr;
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
    return errorCount;
};

Array.prototype.arraysCompareV2 = function(ref) {
    var elem = {};
    elem.overlapCount = 0;
    elem.itemsNotInRef = [];
    elem.refItemsNotInSelf = [];
    for(var i = 0; i < this.length; i++) {
        if(ref.indexOf(this[i]) > -1){
          elem.overlapCount++;
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

Array.prototype.findObjByDiseaseByType = function(t, d) {
  var arr = [];
  this.forEach(function(a){
    if(a.type==t && a.disease==d) 
      arr.push(a);
  });
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
var u = require('underscore');
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
var ajvMsg = require("../datasourceTesting/ajv_tcga_v2_10262016.json");
//var patientID_status = require("../forPatientIDChecking/patientIDsErrorCountsByDiseaseByType.json");
var patientID_status = require("../patientIDTesting/IDstatus_errors_brief.json");
var gene_status = require("../geneSymbols/geneIDstatus_errors_brief.json");
var diseaseCollectionStructureStatus = require("../toolTesting/diseaseCollectionStructuralStatus.json");
var ajvMsg_report = [];
var render_pca_missing_collections = [];
var render_pt_missing_collections = [];
var patientIDs_status=[], patientID_errors = [];
const pcaScoreTypeMapping = {
    'cnv-gistic': "cnv", 
    'cnv-gistic2thd':"cnv",
    'import':"mut01",
    'methylation-HM27': "methylation-hm27", 
    'methylation-HM450': "methylation-hm450", 
    'mut-mut': "mut01",
    'mut01-mutSig2': "mut01",
    'mut01-mutation': "mut01", 
    'mut01-mutationBroadGene': "mut01", 
    'mut01-mutationBcmGene': "mut01", 
    'mut01-wxs': "mut01", 
    'mut01-mutationCuratedWustlGene': "mut01",
    'protein-RPPA': "protein",
    'protein-RPPA-zscore': "protein",
    'rna-Agilent': "rna-agilent", 
    'rna-Agilent-median-zscore': "rna-agilent-median-zscore", 
    'rna-seq-median-zscore': "rna-seq-median-zscore", 
    'rna-seq': "rna-seq", 
    'rna-U133': "rna-u133", 
    'rna-HiSeq': "rna-hiseq"
  };
var onerror = function(e){
  console.log(e);
}

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
  lookup_listed_collections = lookup_listed_collections.unique();

  manifest = yield comongo.db.collection(db, "manifest");
  manifest_arr = yield manifest.find({}).toArray();
  manifest_listed_collections = manifest_arr.map(function(m){ return (m.collection);}).unique();

  collections = yield comongo.db.collections(db);
  existing_collection_names = collections.map(function(c){
    return c['s']['name'];
  }); //getting the names of all collections

  /* Need to clean up the existing_collection_names

   */
  existing_sample_maps = existing_collection_names.containPartialString(/[A-Za-z0-9_-]+_sample_map/g);
  existing_renders = existing_collection_names.containPartialString(/render_+/g);
  existing_lookups = existing_collection_names.containPartialString(/lookup_+/g);
  existing_manifest = existing_collection_names.containPartialString(/manifest+/g);
  existing_collection_names = u.difference(existing_collection_names, existing_sample_maps.concat(existing_renders,existing_lookups,existing_manifest, ["system.js"]));

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
  format.text(existing_collection_names.arraysCompareV2(lookup_listed_collections));
  format.codeStop();
  // format.h3("Compare lookup_listed_collections against the existing collections: ");
  // format.codeStart();
  // format.text(lookup_listed_collections.arraysCompareV2(existing_collection_names));
  // format.codeStop();
  format.h3("Compare the existing collections against manifest_listed_collections: ");
  format.codeStart();
  format.text(existing_collection_names.arraysCompareV2(manifest_listed_collections));
  format.codeStop();
  // format.h3("Compare manifest_listed_collections against the existing collections: ");
  // format.codeStart();
  // format.text(manifest_listed_collections.arraysCompareV2(existing_collection_names));
  // format.codeStop();
  

  /*** survey the collections that exist in the tcga database
                                   listed in render_pca
                                   listed in render_patient
        
   ***/
  format.h1("Part II: Checking rendering collections");
  format.h3("render_pca compare to existing pcascores");
  collection = yield comongo.db.collection(db, 'render_pca');
  render_pca = yield collection.find({},{'disease':true, 'source':true, 'type':true, 'geneset':true}).toArray();
  
  var existing_pcascores = [];
  var rendering_pca_potential_collections = [];
  existing_collection_names.forEach(function(e){if(e.includes('pcascores') && (!e.includes("-1e+05"))) existing_pcascores.push(e);});
  var existing_pca_removal = existing_pcascores.containPartialString(/[A-Za-z0-9_-]+-mut01/g);
  existing_pcascores = u.difference(existing_pcascores, existing_pca_removal);


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
  // //render_pca_missing_collections.length: 264
  // var render_pca_missed_types = render_pca_missing_collections.map(function(r){return r.type;});
  // format.text("Are there any types that render_pca doesn't include? :");
  // format.codeStart();
  // format.text(render_pca_missed_types.unique());
  // format.codeStop();
  // // [ 'import',
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
  var rendering_pca_potential_removal = rendering_pca_potential_collections.containPartialString(/[A-Za-z0-9_-]+-mut01/g);
  rendering_pca_potential_collections = u.difference(rendering_pca_potential_collections, rendering_pca_potential_removal);


  format.h3("Compare the existing collections against render_pca: ");
  format.codeStart();
  format.text(existing_pcascores.arraysCompareV2(rendering_pca_potential_collections));
  format.codeStop();
  // format.h3("Compare render_pca against the existing collections: ");
  // format.codeStart();
  // format.text(rendering_pca_potential_collections.arraysCompare(existing_pcascores));
  // format.codeStop();

  
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

  format.h3("Compare the existing collections against render_patient: ");
  format.codeStart();
  format.text(existing_mds.arraysCompareV2(rendering_pt_potential_collections));
  format.codeStop();
  // format.h3("Compare render_patient against the existing collections: ");
  // format.codeStart();
  // format.text(rendering_pt_potential_collections.arraysCompare(existing_mds));
  // format.codeComment("In render_patient, there are documents with 'cluster' as type, yet 'pca-' as name prefix.");
  // format.text(render_patient_weird_ex);
  // format.codeStop();


  // report the collection erros from ajv_tcga_v2.json 
  
  format.h1("Part III: Data Structural Errors - Run the DB against schemas.json, below lists the error message: ");
  format.codeStart();
  ajvMsg.forEach(function(a){
    if(a!=null && a.passedRate < 1){
      format.text(a);
    }
  });
  format.codeStop();
  // format.codeStart();
  // format.code(ajvMsg_report);
  // format.codeStop();

  // report disease collection structural status against brain in lookup_oncoscape_datasources
  format.h1("Part IV: Check diseae collection structural status against brain in lookup_oncoscape_datasources");
  var diseaseCollection = diseaseCollectionStructureStatus.filter(function(d){
                                              return (d.collectionStructural.length>0&&d.disease !='hg19'); }).map(function(m){
                                              var elem = {};
                                              elem.disease = m.disease;
                                              elem.errors = [];
                                              m.collectionStructural.forEach(function(n){
                                                elem.errors.push(n.schemaPath+'['+n.message + ']');
                                              });
                                              return elem;})

  format.codeStart();
  format.text(diseaseCollection);
  format.codeStop();


  // report the earlier version patient ID checking

  format.h1("Part V: Checked the patient IDs against disease patient collection IDs:");
  
  format.h3("The aggregated result grouped by Disease types and Data Types");
  var diseasesWithPIDErros = u.uniq(patientID_status.map(function(m){return m.disease;}));
  format.codeComment("Below lists the disease types, whose patient IDs in some if not all collections are NOT included in the clinical patient IDs.");
  format.codeStart();
  format.text(diseasesWithPIDErros);
  // [ 'lgg','brca','brain','lusc','hnsc','kirp','luad','gbm','thca','read',
  //   'thym','sarc','pcpg','kirc','coad','ov','paad','cesc','chol','esca',
  //   'tgct','blca','ucec','kich','stad','dlbc','lihc','prad','acc','laml',
  //   'coadread','skcm','lung' ]
  format.codeComment("Below lists the disease types, whose patient IDs in all collections are included in the clinical patient IDs.");
  var totalDiseases = [ 'brain','lusc','hnsc','coadread','brca','gbm','lgg','luad','lung','prad','esca','dlbc','ucs','blca','coad','thca','acc','lihc','paad','ov','skcm','chol','kirc','read','kirp','meso','uvm','cesc','ucec','pcpg','thym','sarc','stad','tgct','kich','laml'];
  format.text(u.difference(totalDiseases, diseasesWithPIDErros));
  // { overlapCount: 0,
  //   itemsNotInRef: [],
  //   refItemsNotInSelf: [ 'uvm', 'meso', 'ucs' ],
  //   countInRef: NaN }
  format.codeStop();


  var typesWithPIDErros =  u.uniq(patientID_status.map(function(m){return m.type;}));
  format.codeComment("Below lists the data types, whose patient IDs in some if not all collections are NOT included in the clinical patient IDs.");
  format.codeStart();
  format.text(typesWithPIDErros);
  // [ 'cnv','protein','events','mut','mds','mut01','edges','otherMalignancy',
  //   'pcaScores','methylation','rna','color','ptDegree' ]
  format.codeComment("Below lists the data types, whose patient IDs in some if not all collections are NOT included in the clinical patient IDs.");
  var totalTypes =[ 'color','events','drug','newTumor','radiation','otherMalignancy','followUp','newTumor-followUp','pcascores','mds','edges','ptDegree' ];
  format.text(u.difference(totalTypes, typesWithPIDErros));
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
  format.codeStop();
  format.text("Detailed aggregated report lists here (sorted by subfield IDstatus.itemsNotInRefLength):");
  format.codeStart();
  patientID_status.forEach(function(s){format.text(s);});
  format.codeStop();
  
  format.h1("Part VI: Checked the gene symbols against HGNC gene symbols: ");

  format.h3("The aggregated result grouped by Disease types and Data Types");
  var diseasesWithGeneIDErrors = u.uniq(gene_status.map(function(m){return m.disease;}));
  format.codeComment("Below lists the disease types, whose gene symbols in some if not all collections are NOT included in the HGNC gene symbols");
  format.codeStart();
  format.text(diseasesWithGeneIDErrors);
  format.codeComment("Below lists the disease types, whose gene symbols in all collections are included in the HGNC gene symbols");
  var totalDiseases = [ 'brain','lusc','hnsc','coadread','brca','gbm','lgg','luad','lung','prad','esca','dlbc','ucs','blca','coad','thca','acc','lihc','paad','ov','skcm','chol','kirc','read','kirp','meso','uvm','cesc','ucec','pcpg','thym','sarc','stad','tgct','kich','laml'];
  format.text(u.difference(totalDiseases, diseasesWithGeneIDErrors));
  format.codeStop();
  var typesWithGeneIDErros =  u.uniq(gene_status.map(function(m){return m.type;}));
  format.codeComment("Below lists the data types, whose gene symbols in some if not all collections are NOT included in the HGNC gene symbols");
  format.codeStart();
  format.text(typesWithGeneIDErros);
  // [ 'cnv','protein','events','mut','mds','mut01','edges','otherMalignancy',
  //   'pcaScores','methylation','rna','color','ptDegree' ]
  format.codeComment("Below lists the data types, whose gene symbols in some if not all collections are included in the HGNC gene symbols");
  var totalTypes =['mut','mut01','methylation','rna','protein','cnv','facs','genesets','annotation','genedegree','edges','genes','pcaloadings' ];   
  format.text(u.difference(totalTypes, typesWithGeneIDErros));
  format.codeStop();
  format.text("Detailed aggregated report lists here (sorted by subfield geneIDstatus.itemsNotInRefLength):");
  format.codeStart();
  gene_status.forEach(function(s){format.text(s);});
  format.codeStop();
  

  yield comongo.db.close(db);
}).catch(onerror);



