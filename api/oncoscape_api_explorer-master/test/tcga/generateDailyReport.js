
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
var jsonfile = require("jsonfile");
var ajvMsg = [];
var ajvMsg_report = [];
var render_pca_missing_collections = [];
var render_pt_missing_collections = [];
var patientIDs_status=[], patientID_errors = [];

var onerror = function(e){
  console.log(e);
}

jsonfile.readFile('ajv_tcga_v2.json', function(err, obj){ajvMsg = obj;});

jsonfile.readFile("patientID_errors.json", function(obj, err){
  patientIDs_status = obj;
});


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
  format.text("According to the collection names, there should be listed types in existing pcascores: ");
  format.codeStart();
  format.text(pcascores_postfix);
  format.codeStop();
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

  // var cnv_p, meth_p, mut01_p, prot_p, rna_p, mut_p, woMol_p, patientIDs_status, patientID_errors;
  // jsonfile.readFile("../status_cnv_10152016.json", function(err, obj){
  //   cnv_p = obj;
  // });

  // jsonfile.readFile("../status_meth_10152016.json", function(err, obj){
  //   meth_p = obj;
  // });

  // jsonfile.readFile("../status_mut01_10152016.json", function(err, obj){
  //   mut01_p = obj;
  // });
  // jsonfile.readFile("../status_protein_10152016.json", function(err, obj){
  //   prot_p = obj;
  // });
  // jsonfile.readFile("../status_rna_10152016.json", function(err, obj){
  //   rna_p = obj;
  // });
  // jsonfile.readFile("../status_protein_10152016.json", function(err, obj){
  //   mut_p = obj;
  // });
  // jsonfile.readFile("../status_woMol_10142016.json", function(err, obj){
  //   woMol_p = obj;
  // });

  // patientID_errors = cnv_p.concat(meth_p, mut01_p, mut_p, rna_p, meth_p, woMol_p);
  // jsonfile.writeFile("patientID_errors.json",{spaces:4}, patientID_errors, function(err){console.log(err);});
  // patientIDs_status.forEach(function(p){
  //   if(p.ptIDStatus.length != 0){
  //     patientID_errors.push(p);
  //   }
  // });
  // patientID_errors.sort(function(a, b){
  //   return b.ptIDStatus.length - a.ptIDStatus.length;
  // });
  // var dis = patientID_errors.map(function(p){return ("Error Counts: " + p.ptIDStatus.length + " [Details: " +p.disease + " "+  p.type + " "+ p.collection + "]");});
  var dis = [
   'Error Counts: 884 [Details: brca ptDegree brca_ptdegree_broad_markergenes545]',
    'Error Counts: 836 [Details: brca ptDegree brca_ptdegree_broad_oncovogel274]',
    'Error Counts: 817 [Details: brca ptDegree brca_ptdegree_broad_oncoplex]',
    'Error Counts: 774 [Details: brain ptDegree brain_ptdegree_broad_markergenes545]',
    'Error Counts: 758 [Details: brain ptDegree brain_ptdegree_broad_oncoplex]',
    'Error Counts: 757 [Details: brain ptDegree brain_ptdegree_broad_oncovogel274]',
    'Error Counts: 732 [Details: brca ptDegree brca_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 719 [Details: brca ptDegree brca_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 698 [Details: brain ptDegree brain_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 633 [Details: brain ptDegree brain_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 581 [Details: gbm ptDegree gbm_ptdegree_ucsc_tcgagbmclassifiers]',
    'Error Counts: 579 [Details: gbm ptDegree gbm_ptdegree_ucsc_oncovogel274]',
    'Error Counts: 579 [Details: gbm ptDegree gbm_ptdegree_ucsc_markergenes545]',
    'Error Counts: 578 [Details: gbm ptDegree gbm_ptdegree_ucsc_oncoplex]',
    'Error Counts: 575 [Details: gbm ptDegree gbm_ptdegree_ucsc_tcgapancanmutated]',
    'Error Counts: 507 [Details: hnsc ptDegree hnsc_ptdegree_broad_markergenes545]',
    'Error Counts: 504 [Details: lgg ptDegree lgg_ptdegree_broad_markergenes545]',
    'Error Counts: 503 [Details: hnsc ptDegree hnsc_ptdegree_broad_oncovogel274]',
    'Error Counts: 502 [Details: lgg ptDegree lgg_ptdegree_broad_oncovogel274]',
    'Error Counts: 501 [Details: lgg ptDegree lgg_ptdegree_broad_oncoplex]',
    'Error Counts: 498 [Details: hnsc ptDegree hnsc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 495 [Details: hnsc ptDegree hnsc_ptdegree_broad_oncoplex]',
    'Error Counts: 491 [Details: luad ptDegree luad_ptdegree_broad_markergenes545]',
    'Error Counts: 490 [Details: brca rna brca_rna_cbio_seq-median-zscore]',
    'Error Counts: 486 [Details: luad ptDegree luad_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 484 [Details: lgg ptDegree lgg_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 477 [Details: luad ptDegree luad_ptdegree_broad_oncovogel274]',
    'Error Counts: 476 [Details: luad ptDegree luad_ptdegree_broad_oncoplex]',
    'Error Counts: 473 [Details: hnsc ptDegree hnsc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 457 [Details: luad ptDegree luad_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 426 [Details: kirc ptDegree kirc_ptdegree_broad_markergenes545]',
    'Error Counts: 422 [Details: prad ptDegree prad_ptdegree_broad_markergenes545]',
    'Error Counts: 419 [Details: thca ptDegree thca_ptdegree_broad_markergenes545]',
    'Error Counts: 397 [Details: kirc ptDegree kirc_ptdegree_broad_oncoplex]',
    'Error Counts: 396 [Details: kirc ptDegree kirc_ptdegree_broad_oncovogel274]',
    'Error Counts: 394 [Details: thca ptDegree thca_ptdegree_broad_oncoplex]',
    'Error Counts: 393 [Details: blca ptDegree blca_ptdegree_broad_markergenes545]',
    'Error Counts: 390 [Details: hnsc ptDegree hnsc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 390 [Details: thca ptDegree thca_ptdegree_broad_oncovogel274]',
    'Error Counts: 388 [Details: lgg ptDegree lgg_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 388 [Details: blca ptDegree blca_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 388 [Details: blca ptDegree blca_ptdegree_broad_oncovogel274]',
    'Error Counts: 387 [Details: blca ptDegree blca_ptdegree_broad_oncoplex]',
    'Error Counts: 381 [Details: blca ptDegree blca_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 381 [Details: stad ptDegree stad_ptdegree_broad_markergenes545]',
    'Error Counts: 379 [Details: stad ptDegree stad_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 377 [Details: prad ptDegree prad_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 376 [Details: stad ptDegree stad_ptdegree_broad_oncovogel274]',
    'Error Counts: 373 [Details: stad ptDegree stad_ptdegree_broad_oncoplex]',
    'Error Counts: 370 [Details: skcm rna skcm_rna_ucsc_hiseq]',
    'Error Counts: 368 [Details: esca ptDegree esca_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 368 [Details: esca ptDegree esca_ptdegree_broad_markergenes545]',
    'Error Counts: 367 [Details: brain ptDegree brain_ptdegree_broad_osccchen9genes]',
    'Error Counts: 363 [Details: kirc ptDegree kirc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 360 [Details: esca ptDegree esca_ptdegree_broad_oncovogel274]',
    'Error Counts: 353 [Details: kirc ptDegree kirc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 352 [Details: lihc ptDegree lihc_ptdegree_broad_markergenes545]',
    'Error Counts: 350 [Details: thca ptDegree thca_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 350 [Details: esca ptDegree esca_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 347 [Details: lihc ptDegree lihc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 340 [Details: stad ptDegree stad_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 337 [Details: lihc ptDegree lihc_ptdegree_broad_oncovogel274]',
    'Error Counts: 337 [Details: luad ptDegree luad_ptdegree_broad_osccchen131probes]',
    'Error Counts: 335 [Details: prad ptDegree prad_ptdegree_broad_oncovogel274]',
    'Error Counts: 332 [Details: prad ptDegree prad_ptdegree_broad_oncoplex]',
    'Error Counts: 329 [Details: lihc ptDegree lihc_ptdegree_broad_oncoplex]',
    'Error Counts: 302 [Details: brca ptDegree brca_ptdegree_broad_osccchen9genes]',
    'Error Counts: 298 [Details: hnsc ptDegree hnsc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-markergenes545-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-oncovogel274-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-osccchen131probes-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-osccchen9genes-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-oncoplex-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm edges skcm_edges_broad_markergenes545]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-allgenes-mut01]',
    'Error Counts: 290 [Details: skcm pcaScores skcm_pcascores_broad_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 290 [Details: skcm mut01 skcm_mut01_broad_mutsig2]',
    'Error Counts: 289 [Details: lihc ptDegree lihc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 289 [Details: blca ptDegree blca_ptdegree_broad_osccchen131probes]',
    'Error Counts: 283 [Details: skcm edges skcm_edges_broad_tcgagbmclassifiers]',
    'Error Counts: 283 [Details: lgg ptDegree lgg_ptdegree_broad_osccchen9genes]',
    'Error Counts: 282 [Details: skcm edges skcm_edges_broad_oncovogel274]',
    'Error Counts: 279 [Details: luad ptDegree luad_ptdegree_broad_osccchen9genes]',
    'Error Counts: 279 [Details: skcm edges skcm_edges_broad_oncoplex]',
    'Error Counts: 270 [Details: gbm ptDegree gbm_ptdegree_broad_markergenes545]',
    'Error Counts: 270 [Details: skcm edges skcm_edges_broad_tcgapancanmutated]',
    'Error Counts: 267 [Details: thca ptDegree thca_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 257 [Details: gbm ptDegree gbm_ptdegree_broad_oncoplex]',
    'Error Counts: 256 [Details: brca ptDegree brca_ptdegree_broad_osccchen131probes]',
    'Error Counts: 255 [Details: gbm ptDegree gbm_ptdegree_broad_oncovogel274]',
    'Error Counts: 254 [Details: skcm protein skcm_protein_ucsc_rppa]',
    'Error Counts: 252 [Details: stad ptDegree stad_ptdegree_broad_osccchen131probes]',
    'Error Counts: 247 [Details: ucec ptDegree ucec_ptdegree_broad_oncovogel274]',
    'Error Counts: 246 [Details: ucec ptDegree ucec_ptdegree_broad_oncoplex]',
    'Error Counts: 246 [Details: ucec ptDegree ucec_ptdegree_broad_markergenes545]',
    'Error Counts: 246 [Details: ucec ptDegree ucec_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 245 [Details: gbm ptDegree gbm_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 243 [Details: kirp ptDegree kirp_ptdegree_broad_markergenes545]',
    'Error Counts: 238 [Details: brain ptDegree brain_ptdegree_broad_osccchen131probes]',
    'Error Counts: 238 [Details: skcm edges skcm_edges_broad_osccchen131probes]',
    'Error Counts: 236 [Details: kirp ptDegree kirp_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 229 [Details: blca ptDegree blca_ptdegree_broad_osccchen9genes]',
    'Error Counts: 228 [Details: ucec ptDegree ucec_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 223 [Details: prad ptDegree prad_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 219 [Details: kirp ptDegree kirp_ptdegree_broad_oncovogel274]',
    'Error Counts: 218 [Details: kirp ptDegree kirp_ptdegree_broad_oncoplex]',
    'Error Counts: 215 [Details: stad ptDegree stad_ptdegree_broad_osccchen9genes]',
    'Error Counts: 214 [Details: gbm ptDegree gbm_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 212 [Details: sarc ptDegree sarc_ptdegree_broad_markergenes545]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 196 [Details: laml mut01 laml_mut01_ucsc_mutation]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-allgenes-mut01]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncovogel274-mut01]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-markergenes545-mut01]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-osccchen131probes-mut01]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncoplex-mut01]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 196 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncoplex-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-markergenes545-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-allgenes-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncoplex-cnv-1e+05]',
    'Error Counts: 191 [Details: laml cnv laml_cnv_ucsc_gistic2thd]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncovogel274-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-oncovogel274-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-allgenes-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-osccchen9genes-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgapancanmutated-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-osccchen131probes-cnv]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-osccchen131probes-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-osccchen9genes-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-tcgapancanmutated-cnv-1e+05]',
    'Error Counts: 191 [Details: laml pcaScores laml_pcascores_ucsc_prcomp-markergenes545-cnv]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-markergenes545-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-oncoplex-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-allgenes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-oncovogel274-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-allgenes-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-osccchen131probes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-markergenes545-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-osccchen9genes-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-osccchen9genes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-oncoplex-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-oncovogel274-cnv-mut01-ucsc]',
    'Error Counts: 187 [Details: laml mds laml_mds_ucsc_mds-osccchen131probes-cnv-mut01-ucsc]',
    'Error Counts: 184 [Details: esca ptDegree esca_ptdegree_broad_tcgagbmclassifiers-mut01]',
    'Error Counts: 183 [Details: paad ptDegree paad_ptdegree_broad_markergenes545]',
    'Error Counts: 181 [Details: paad ptDegree paad_ptdegree_broad_oncoplex]',
    'Error Counts: 181 [Details: paad ptDegree paad_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 181 [Details: paad ptDegree paad_ptdegree_broad_oncovogel274]',
    'Error Counts: 180 [Details: esca ptDegree esca_ptdegree_broad_oncoplex]',
    'Error Counts: 180 [Details: sarc ptDegree sarc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 180 [Details: cesc ptDegree cesc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 179 [Details: cesc ptDegree cesc_ptdegree_broad_markergenes545]',
    'Error Counts: 178 [Details: sarc ptDegree sarc_ptdegree_broad_oncovogel274]',
    'Error Counts: 176 [Details: sarc ptDegree sarc_ptdegree_broad_oncoplex]',
    'Error Counts: 176 [Details: lusc ptDegree lusc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 176 [Details: lusc ptDegree lusc_ptdegree_broad_markergenes545]',
    'Error Counts: 175 [Details: lusc ptDegree lusc_ptdegree_broad_oncovogel274]',
    'Error Counts: 175 [Details: lusc ptDegree lusc_ptdegree_broad_oncoplex]',
    'Error Counts: 173 [Details: laml rna laml_rna_ucsc_hiseq]',
    'Error Counts: 169 [Details: cesc ptDegree cesc_ptdegree_broad_oncovogel274]',
    'Error Counts: 168 [Details: cesc ptDegree cesc_ptdegree_broad_oncoplex]',
    'Error Counts: 168 [Details: lusc ptDegree lusc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 167 [Details: paad ptDegree paad_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 154 [Details: lihc ptDegree lihc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 151 [Details: esca ptDegree esca_ptdegree_broad_osccchen9genes]',
    'Error Counts: 145 [Details: kirc ptDegree kirc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 144 [Details: lusc ptDegree lusc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 142 [Details: lusc ptDegree lusc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 137 [Details: cesc ptDegree cesc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 132 [Details: paad ptDegree paad_ptdegree_broad_osccchen9genes]',
    'Error Counts: 128 [Details: sarc ptDegree sarc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 128 [Details: lihc ptDegree lihc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 125 [Details: ucec ptDegree ucec_ptdegree_broad_osccchen131probes]',
    'Error Counts: 123 [Details: esca ptDegree esca_ptdegree_broad_osccchen131probes]',
    'Error Counts: 120 [Details: lgg ptDegree lgg_ptdegree_broad_osccchen131probes]',
    'Error Counts: 118 [Details: gbm ptDegree gbm_ptdegree_broad_osccchen131probes]',
    'Error Counts: 118 [Details: prad ptDegree prad_ptdegree_broad_osccchen131probes]',
    'Error Counts: 117 [Details: kirp ptDegree kirp_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 113 [Details: skcm edges skcm_edges_broad_osccchen9genes]',
    'Error Counts: 112 [Details: paad ptDegree paad_ptdegree_broad_osccchen131probes]',
    'Error Counts: 100 [Details: ucec ptDegree ucec_ptdegree_broad_osccchen9genes]',
    'Error Counts: 91 [Details: kirp ptDegree kirp_ptdegree_broad_osccchen131probes]',
    'Error Counts: 87 [Details: acc ptDegree acc_ptdegree_broad_markergenes545]',
    'Error Counts: 84 [Details: acc ptDegree acc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 84 [Details: gbm ptDegree gbm_ptdegree_broad_osccchen9genes]',
    'Error Counts: 79 [Details: sarc ptDegree sarc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 77 [Details: cesc ptDegree cesc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 75 [Details: acc ptDegree acc_ptdegree_broad_oncoplex]',
    'Error Counts: 75 [Details: acc ptDegree acc_ptdegree_broad_oncovogel274]',
    'Error Counts: 67 [Details: thca rna thca_rna_ucsc_hiseq]',
    'Error Counts: 65 [Details: kich ptDegree kich_ptdegree_broad_markergenes545]',
    'Error Counts: 62 [Details: sarc ptDegree sarc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 61 [Details: luad methylation luad_methylation_cbio_hm27]',
    'Error Counts: 61 [Details: luad rna luad_rna_ucsc_hiseq]',
    'Error Counts: 61 [Details: prad ptDegree prad_ptdegree_broad_osccchen9genes]',
    'Error Counts: 61 [Details: luad methylation luad_methylation_cbio_hm27]',
    'Error Counts: 60 [Details: kich ptDegree kich_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 58 [Details: acc ptDegree acc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 57 [Details: luad mut01 luad_mut01_cbio_mut]',
    'Error Counts: 55 [Details: kich ptDegree kich_ptdegree_broad_oncovogel274]',
    'Error Counts: 55 [Details: thca ptDegree thca_ptdegree_broad_osccchen131probes]',
    'Error Counts: 54 [Details: kich ptDegree kich_ptdegree_broad_oncoplex]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-osccchen131probes-mut01]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-oncovogel274-mut01]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-osccchen9genes-mut01]',
    'Error Counts: 53 [Details: prad rna prad_rna_ucsc_hiseq]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-oncoplex-mut01]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-allgenes-mut01]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 53 [Details: luad mut01 luad_mut01_ucsc_mutationbroadgene]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 53 [Details: luad pcaScores luad_pcascores_ucsc_prcomp-markergenes545-mut01]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-osccchen131probes-mut01]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-allgenes-mut01]',
    'Error Counts: 52 [Details: lusc rna lusc_rna_ucsc_hiseq]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-oncoplex-mut01]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 52 [Details: luad mut01 luad_mut01_broad_mutsig2]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-oncovogel274-mut01]',
    'Error Counts: 52 [Details: lihc rna lihc_rna_ucsc_hiseq]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-markergenes545-mut01]',
    'Error Counts: 52 [Details: luad pcaScores luad_pcascores_broad_prcomp-osccchen9genes-mut01]',
    'Error Counts: 51 [Details: luad edges luad_edges_broad_markergenes545]',
    'Error Counts: 50 [Details: luad edges luad_edges_broad_oncovogel274]',
    'Error Counts: 50 [Details: luad edges luad_edges_broad_tcgagbmclassifiers]',
    'Error Counts: 49 [Details: luad edges luad_edges_broad_oncoplex]',
    'Error Counts: 48 [Details: dlbc ptDegree dlbc_ptdegree_broad_markergenes545]',
    'Error Counts: 47 [Details: luad edges luad_edges_broad_tcgapancanmutated]',
    'Error Counts: 46 [Details: dlbc ptDegree dlbc_ptdegree_ucsc_tcgagbmclassifiers]',
    'Error Counts: 46 [Details: dlbc ptDegree dlbc_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 44 [Details: dlbc ptDegree dlbc_ptdegree_broad_oncovogel274]',
    'Error Counts: 42 [Details: acc ptDegree acc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 42 [Details: dlbc ptDegree dlbc_ptdegree_broad_oncoplex]',
    'Error Counts: 36 [Details: luad edges luad_edges_broad_osccchen131probes]',
    'Error Counts: 35 [Details: stad rna stad_rna_ucsc_hiseq]',
    'Error Counts: 35 [Details: chol ptDegree chol_ptdegree_broad_markergenes545]',
    'Error Counts: 35 [Details: chol ptDegree chol_ptdegree_ucsc_tcgagbmclassifiers]',
    'Error Counts: 34 [Details: kich ptDegree kich_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 34 [Details: chol ptDegree chol_ptdegree_broad_tcgagbmclassifiers]',
    'Error Counts: 33 [Details: chol ptDegree chol_ptdegree_broad_oncoplex]',
    'Error Counts: 33 [Details: kirp rna kirp_rna_ucsc_hiseq]',
    'Error Counts: 33 [Details: chol ptDegree chol_ptdegree_broad_oncovogel274]',
    'Error Counts: 33 [Details: dlbc ptDegree dlbc_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 32 [Details: luad edges luad_edges_broad_osccchen9genes]',
    'Error Counts: 30 [Details: chol ptDegree chol_ptdegree_broad_tcgapancanmutated]',
    'Error Counts: 30 [Details: cesc ptDegree cesc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 29 [Details: kirc ptDegree kirc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 26 [Details: dlbc ptDegree dlbc_ptdegree_broad_osccchen131probes]',
    'Error Counts: 26 [Details: brain mut01 brain_mut01_ucsc_import]',
    'Error Counts: 25 [Details: ucec rna ucec_rna_ucsc_hiseq]',
    'Error Counts: 25 [Details: kich rna kich_rna_ucsc_hiseq]',
    'Error Counts: 22 [Details: kich ptDegree kich_ptdegree_broad_osccchen9genes]',
    'Error Counts: 22 [Details: tgct rna tgct_rna_ucsc_hiseq]',
    'Error Counts: 21 [Details: acc ptDegree acc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 20 [Details: brain methylation brain_methylation_cbio_hm27]',
    'Error Counts: 20 [Details: brain methylation brain_methylation_cbio_hm27]',
    'Error Counts: 19 [Details: chol ptDegree chol_ptdegree_broad_osccchen131probes]',
    'Error Counts: 19 [Details: blca rna blca_rna_ucsc_hiseq]',
    'Error Counts: 18 [Details: tgct protein tgct_protein_ucsc_rppa]',
    'Error Counts: 17 [Details: kich ptDegree kich_ptdegree_broad_osccchen131probes]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-tcgapancanmutated-methylation-hm27-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen9genes-mut01]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-allgenes-mut01]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-oncovogel274-methylation-hm27]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-oncoplex-methylation-hm27]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-markergenes545-mut01]',
    'Error Counts: 15 [Details: kirp ptDegree kirp_ptdegree_broad_osccchen9genes]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-osccchen131probes-methylation-hm27]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 15 [Details: lgg mut01 lgg_mut01_ucsc_mutationbroadgene]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-markergenes545-methylation-hm27-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen131probes-mut01]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncovogel274-mut01]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-tcgapancanmutated-methylation-hm27]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-markergenes545-methylation-hm27]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-osccchen131probes-methylation-hm27-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-oncovogel274-methylation-hm27-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncoplex-mut01]',
    'Error Counts: 15 [Details: brain pcaScores brain_pcascores_cbio_prcomp-oncoplex-methylation-hm27-1e+05]',
    'Error Counts: 15 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 14 [Details: brain pcaScores brain_pcascores_cbio_prcomp-osccchen9genes-methylation-hm27]',
    'Error Counts: 14 [Details: brain pcaScores brain_pcascores_cbio_prcomp-osccchen9genes-methylation-hm27-1e+05]',
    'Error Counts: 12 [Details: gbm edges gbm_edges_ucsc_oncovogel274]',
    'Error Counts: 12 [Details: esca rna esca_rna_ucsc_hiseq]',
    'Error Counts: 12 [Details: gbm edges gbm_edges_ucsc_tcgapancanmutated]',
    'Error Counts: 12 [Details: gbm edges gbm_edges_ucsc_tcgagbmclassifiers]',
    'Error Counts: 12 [Details: gbm edges gbm_edges_ucsc_markergenes545]',
    'Error Counts: 12 [Details: ov protein ov_protein_ucsc_rppa]',
    'Error Counts: 12 [Details: gbm edges gbm_edges_ucsc_oncoplex]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen131probes-mut01]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen9genes-mut01]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncoplex-mut01]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-allgenes-mut01]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 11 [Details: brain pcaScores brain_pcascores_cbio_prcomp-tcgagbmclassifiers-methylation-hm27-1e+05]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 11 [Details: dlbc ptDegree dlbc_ptdegree_broad_osccchen9genes]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncovogel274-mut01]',
    'Error Counts: 11 [Details: chol ptDegree chol_ptdegree_broad_osccchen9genes]',
    'Error Counts: 11 [Details: gbm mut01 gbm_mut01_ucsc_mutationbroadgene]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-markergenes545-mut01]',
    'Error Counts: 11 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 11 [Details: brain pcaScores brain_pcascores_cbio_prcomp-tcgagbmclassifiers-methylation-hm27]',
    'Error Counts: 9 [Details: chol rna chol_rna_ucsc_hiseq]',
    'Error Counts: 8 [Details: pcpg rna pcpg_rna_ucsc_hiseq]',
    'Error Counts: 7 [Details: brain cnv brain_cnv_cbio_gistic]',
    'Error Counts: 7 [Details: brca rna brca_rna_cbio_agilent-median-zscore]',
    'Error Counts: 7 [Details: lgg protein lgg_protein_ucsc_rppa]',
    'Error Counts: 7 [Details: thca ptDegree thca_ptdegree_broad_osccchen9genes]',
    'Error Counts: 6 [Details: sarc rna sarc_rna_ucsc_hiseq]',
    'Error Counts: 6 [Details: cesc rna cesc_rna_ucsc_hiseq]',
    'Error Counts: 6 [Details: brca methylation brca_methylation_cbio_hm450]',
    'Error Counts: 6 [Details: brain pcaScores brain_pcascores_cbio_prcomp-allgenes-methylation-hm27]',
    'Error Counts: 6 [Details: brca methylation brca_methylation_cbio_hm450]',
    'Error Counts: 6 [Details: brain pcaScores brain_pcascores_cbio_prcomp-allgenes-methylation-hm27-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncovogel274-cnv-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-allgenes-cnv]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgagbmclassifiers-cnv]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen131probes-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgagbmclassifiers-cnv-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-markergenes545-cnv]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncoplex-cnv]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncoplex-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncoplex-cnv-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgapancanmutated-cnv-1e+05]',
    'Error Counts: 5 [Details: brain cnv brain_cnv_ucsc-pnas_gistic]',
    'Error Counts: 5 [Details: paad rna paad_rna_ucsc_hiseq]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncovogel274-cnv]',
    'Error Counts: 5 [Details: brca mut01 brca_mut01_cbio_wxs]',
    'Error Counts: 5 [Details: brca mut01 brca_mut01_ucsc_mutationcuratedwustlgene]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen9genes-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-markergenes545-cnv-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-markergenes545-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen9genes-cnv]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen131probes-cnv]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen131probes-cnv-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgapancanmutated-cnv]',
    'Error Counts: 5 [Details: brain cnv brain_cnv_ucsc_gistic]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-allgenes-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-osccchen9genes-cnv-1e+05]',
    'Error Counts: 5 [Details: brain color brain_color_tcga_import]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-oncovogel274-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 5 [Details: brain mut01 brain_mut01_ucsc-pnas_import]',
    'Error Counts: 5 [Details: brain pcaScores brain_pcascores_ucsc-pnas_prcomp-allgenes-cnv-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen9genes-cnv-1e+05]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-allgenes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-markergenes545-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mut01 brain_mut01_cbio_wxs]',
    'Error Counts: 4 [Details: brain mut01 brain_mut01_broad_mutsig2]',
    'Error Counts: 4 [Details: brain edges brain_edges_broad_markergenes545]',
    'Error Counts: 4 [Details: coad protein coad_protein_ucsc_rppa]',
    'Error Counts: 4 [Details: ov rna ov_rna_ucsc_hiseq]',
    'Error Counts: 4 [Details: gbm cnv gbm_cnv_ucsc_gistic2thd]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncovogel274-cnv-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen131probes-cnv]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-osccchen9genes-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-allgenes-cnv-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-osccchen9genes-mut01]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-allgenes-mut01]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-markergenes545-mut01]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-markergenes545-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncovogel274-cnv]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgapancanmutated-cnv]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-oncoplex-mut01]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-oncovogel274-mut01]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-markergenes545-cnv]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen9genes-cnv]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-osccchen131probes-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-osccchen131probes-cnv-1e+05]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-oncovogel274-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-allgenes-cnv]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-osccchen131probes-mut01]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-tcgapancanmutated-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncoplex-cnv-1e+05]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-tcgapancanmutated-cnv-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-oncoplex-cnv]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-allgenes-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-tcgagbmclassifiers-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 4 [Details: gbm pcaScores gbm_pcascores_ucsc_prcomp-markergenes545-cnv-1e+05]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-markergenes545-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: brain pcaScores brain_pcascores_broad_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-osccchen131probes-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-osccchen9genes-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-tcgagbmclassifiers-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-oncoplex-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-allgenes-cnv-mut01-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-tcgapancanmutated-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-allgenes-cnv-mut01-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-oncovogel274-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-markergenes545-cnv-mut01-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-ucsc]',
    'Error Counts: 4 [Details: brain mds brain_mds_ucsc-pnas_mds-oncoplex-cnv-mut01-1e+05-ucsc-pnas]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 3 [Details: brain edges brain_edges_broad_tcgagbmclassifiers]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-osccchen9genes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-oncovogel274-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-osccchen131probes-mut01]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-allgenes-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-osccchen9genes-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-oncovogel274-mut01]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-allgenes-mut01]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-oncoplex-mut01]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-allgenes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-oncovogel274-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-oncoplex-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: brain edges brain_edges_broad_oncovogel274]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-osccchen9genes-mut01]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 3 [Details: brain edges brain_edges_broad_oncoplex]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-markergenes545-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-markergenes545-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: gbm edges gbm_edges_broad_markergenes545]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-osccchen131probes-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 3 [Details: brain edges brain_edges_broad_osccchen131probes]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-oncoplex-cnv-mut01-ucsc]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 3 [Details: gbm pcaScores gbm_pcascores_broad_prcomp-markergenes545-mut01]',
    'Error Counts: 3 [Details: gbm edges gbm_edges_broad_osccchen131probes]',
    'Error Counts: 3 [Details: kirc otherMalignancy kirc_othermalignancy_tcga_v4p0]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: brain edges brain_edges_broad_tcgapancanmutated]',
    'Error Counts: 3 [Details: pcpg protein pcpg_protein_ucsc_rppa]',
    'Error Counts: 3 [Details: brain protein brain_protein_cbio_rppa-zscore]',
    'Error Counts: 3 [Details: sarc protein sarc_protein_ucsc_rppa]',
    'Error Counts: 3 [Details: gbm mds gbm_mds_ucsc_mds-osccchen131probes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 3 [Details: gbm mut01 gbm_mut01_broad_mutsig2]',
    'Error Counts: 2 [Details: brca events brca_events_tcga_clinical]',
    'Error Counts: 2 [Details: gbm edges gbm_edges_broad_oncovogel274]',
    'Error Counts: 2 [Details: hnsc methylation hnsc_methylation_cbio_hm450]',
    'Error Counts: 2 [Details: luad methylation luad_methylation_cbio_hm450]',
    'Error Counts: 2 [Details: brca methylation brca_methylation_cbio_hm27]',
    'Error Counts: 2 [Details: thym rna thym_rna_ucsc_hiseq]',
    'Error Counts: 2 [Details: brain rna brain_rna_cbio_rnaseq-bc]',
    'Error Counts: 2 [Details: luad rna luad_rna_cbio_seq]',
    'Error Counts: 2 [Details: brca methylation brca_methylation_cbio_hm27]',
    'Error Counts: 2 [Details: gbm edges gbm_edges_broad_tcgagbmclassifiers]',
    'Error Counts: 2 [Details: thca protein thca_protein_ucsc_rppa]',
    'Error Counts: 2 [Details: brain pcaScores brain_pcascores_cbio_prcomp-allgenes-protein-1e+05]',
    'Error Counts: 2 [Details: read protein read_protein_ucsc_rppa]',
    'Error Counts: 2 [Details: brain pcaScores brain_pcascores_cbio_prcomp-allgenes-protein]',
    'Error Counts: 2 [Details: gbm edges gbm_edges_broad_tcgapancanmutated]',
    'Error Counts: 2 [Details: gbm edges gbm_edges_broad_oncoplex]',
    'Error Counts: 2 [Details: hnsc methylation hnsc_methylation_cbio_hm450]',
    'Error Counts: 2 [Details: luad methylation luad_methylation_cbio_hm450]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-osccchen9genes-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-allgenes-cnv]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-oncovogel274-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-oncovogel274-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncovogel274-cnv]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: brain edges brain_edges_broad_osccchen9genes]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgapancanmutated-cnv]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-osccchen9genes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-markergenes545-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg edges lgg_edges_broad_osccchen9genes]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-oncovogel274-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-markergenes545-cnv]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-osccchen131probes-mut01-1e+05]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-markergenes545-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen9genes-cnv]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-oncoplex-mut01]',
    'Error Counts: 1 [Details: lgg edges lgg_edges_broad_markergenes545]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-allgenes-mut01]',
    'Error Counts: 1 [Details: lgg edges lgg_edges_broad_tcgapancanmutated]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-markergenes545-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-allgenes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-markergenes545-mut01-1e+05]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-osccchen131probes-mut01]',
    'Error Counts: 1 [Details: lgg edges lgg_edges_broad_tcgagbmclassifiers]',
    'Error Counts: 1 [Details: lgg edges lgg_edges_broad_oncovogel274]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgapancanmutated-cnv-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncovogel274-cnv-1e+05]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-osccchen131probes-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-osccchen9genes-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen131probes-cnv-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncoplex-cnv]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-tcgagbmclassifiers-mut01-1e+05]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen131probes-cnv]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-allgenes-mut01]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-oncoplex-mut01]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-osccchen131probes-mut01]',
    'Error Counts: 1 [Details: luad otherMalignancy luad_othermalignancy_tcga_v4p0]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-markergenes545-cnv-1e+05]',
    'Error Counts: 1 [Details: hnsc events hnsc_events_tcga_clinical]',
    'Error Counts: 1 [Details: lusc events lusc_events_tcga_clinical]',
    'Error Counts: 1 [Details: luad events luad_events_tcga_clinical]',
    'Error Counts: 1 [Details: lgg events lgg_events_tcga_clinical]',
    'Error Counts: 1 [Details: gbm events gbm_events_tcga_clinical]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-tcgapancanmutated-mut01]',
    'Error Counts: 1 [Details: brain events brain_events_tcga_clinical]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-oncovogel274-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-osccchen9genes-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-oncoplex-cnv-1e+05]',
    'Error Counts: 1 [Details: paad rna paad_rna_cbio_seq]',
    'Error Counts: 1 [Details: lgg cnv lgg_cnv_ucsc_gistic2thd]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_ucsc_prcomp-osccchen9genes-cnv-1e+05]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-markergenes545-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: lgg edges lgg_edges_broad_oncoplex]',
    'Error Counts: 1 [Details: prad rna prad_rna_cbio_agilent]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-allgenes-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: gbm protein gbm_protein_ucsc_rppa]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-oncoplex-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: kirp protein kirp_protein_ucsc_rppa]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-oncoplex-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-tcgapancanmutated-mut01-1e+05]',
    'Error Counts: 1 [Details: brca protein brca_protein_cbio_rppa-zscore]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-oncovogel274-mut01-1e+05]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-osccchen131probes-cnv-mut01-1e+05-ucsc]',
    'Error Counts: 1 [Details: lgg mds lgg_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-ucsc]',
    'Error Counts: 1 [Details: hnsc mut01 hnsc_mut01_ucsc_mutationbroadgene]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-osccchen9genes-mut01]',
    'Error Counts: 1 [Details: lgg mut01 lgg_mut01_broad_mutsig2]',
    'Error Counts: 1 [Details: lgg pcaScores lgg_pcascores_broad_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-oncoplex-mut01-1e+05]',
    'Error Counts: 1 [Details: hnsc pcaScores hnsc_pcascores_ucsc_prcomp-allgenes-mut01-1e+05]',
    'Error Counts: 1 [Details: brca cnv brca_cnv_cbio_gistic]',
    'Error Counts: 1 [Details: brca cnv brca_cnv_ucsc_gistic2thd]'];
  format.h1("Part IV: Checked the patient IDs against disease patient collection IDs:");
  format.codeStart();
  format.text(dis);
  format.codeStop();

  yield comongo.db.close(db);
}).catch(onerror);



