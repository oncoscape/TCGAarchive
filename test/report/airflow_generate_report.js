const comongo = require('co-mongodb');
const co = require('co');
const u = require('underscore');
const jsonfile = require("jsonfile-promised");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
var ajvMsg = require("/usr/local/airflow/docker-airflow/onco-test/dataStr/ajv_test2.json");
var patientID_status = require("/usr/local/airflow/docker-airflow/onco-test/ptIDs/IDstatus_errors_brief.json");
var gene_status = require("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/output3.json");
//var diseaseCollectionStructureStatus = require("../toolTesting/diseaseCollectionStructuralStatus.json");
var duplicatedFields = require("/usr/local/airflow/docker-airflow/onco-test/duplicatedFields.json");
var collectionSize = require("/usr/local/airflow/docker-airflow/onco-test/CollectionSize.json");
var validateCalculatedFromMolecular = require("./validateCalculatedFromMolecular.json");
//var lookup_toolTesting = require("../toolTesting/lookup.json");
//var molecularMinMaxChecking = require("./CheckingMinMaxValues.json");
var x_range = require("/usr/local/airflow/docker-airflow/onco-test/x_range.json");
var collectionNameRegex = /[A-Za-z0-9_-]+/g;
var db, collections, existing_collection_names, manifest;
var manifest_arr = [];
var lookup_table = [];
var lookup_listed_collections = [];
var manifest_listed_collections = [];
var keyFields = [];
var render_pca = [];
var render_patient = [];
var usedFields = ['annotation','location','category','molecular','clinical','calculated','edges'];

const pcaScoreTypeMapping = {
    'cnv-gistic': "cnv",  
    'cnv-gistic2thd':"cnv",
    '-import':"mut01",
    'methylation-HM27': "methylation-hm27", 
    'methylation-HM450': "methylation-hm450", 
    'mut-mutation': "mut01",
    '-mut01-mutationBroadGene': "mut01",
    'mut01-mutSig2': "mut01",
    'mut01-mutation': "mut01", 
    'mut01-mutationBroadGene': "mut01", 
    'mut01-mutationBcmGene': "mut01", 
    'mut01-wxs': "mut01",
    'mut01-ucsc': "mut01",
    'mut01-broadcurated': "mut01", 
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
const clinicalTypes = ["patient","drug","newTumor","otherMalignancy","radiation","followUp","newTumor-followUp"];
var clinical_input = ajvMsg.filter(function(m){return (clinicalTypes.indexOf(m.type) > -1);});

var checkClinicalFields = function(db, collection, type, disease){
  return new Promise(function(resolve, reject){
    var elem = {};
    elem.collection = collection;
    elem.type = type;
    elem.disease = disease;
    elem.fieldDuplicates = [];
    //console.log(collection);
    var count = 0; 
    var cursor = db.collection(collection).find();
    cursor.each(function(err, item){
        if(item != null){
          //console.log(count++);
          var dup =[];
          var dupObj = u.countBy(Object.keys(item));
          //console.log(dupObj);
          Object.keys(dupObj).forEach(function(el){
            //console.log(el);
            if(dupObj[el] > 1) dup.push(el);});
          // console.log(dup);
          //.filter(function(m){return m>1;});
          //if(dup.length > 0){
            elem.fieldDuplicates = elem.fieldDuplicates.concat(dup);
          //}
        }else{
         resolve(elem);
        }
      });
  });
}  



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
  var manifest_excludes = manifest_arr.filter(function(m){return "dne" in m;}).map(function(m){return m.collection;});
  manifest_listed_collections = u.difference(manifest_listed_collections, manifest_excludes);
  collections = yield comongo.db.collections(db);
  var existing_collection_names_all = collections.map(function(c){
    return c['s']['name'];
  }); //getting the names of all collections

  /* Need to clean up the existing_collection_names

   */
  existing_sample_maps = existing_collection_names_all.containPartialString(/[A-Za-z0-9_-]+_sample_map/g);
  existing_renders = existing_collection_names_all.containPartialString(/render_+/g);
  existing_lookups = existing_collection_names_all.containPartialString(/lookup_+/g);
  existing_manifest = existing_collection_names_all.containPartialString(/manifest+/g);
  existing_collection_names = u.difference(existing_collection_names_all, existing_sample_maps.concat(existing_renders,existing_lookups,existing_manifest, ["system.js"]));

  helper.format.h1("Part I: Checking existing collections against lookup_oncoscape_datasources and manifest files");
  helper.format.h3("The number of the collections in database tcga is: ");
  helper.format.text(existing_collection_names_all.length);
  helper.format.h5("After remove render collections, manifest, lookup collections, and mapping collections the true Data Collection Length is: ");
  helper.format.text(existing_collection_names.length);
  helper.format.h3("The number listed in lookup_oncoscape_datasources is: "); 
  helper.format.text(lookup_listed_collections.length);
  helper.format.h3("The number listed in manifest is: ");
  helper.format.text(manifest_listed_collections.length);
  helper.format.h3("Compare the existing collections against lookup_listed_collections: ");
  helper.format.codeStart();
  helper.format.text(existing_collection_names.arraysCompareV2(lookup_listed_collections));
  helper.format.codeStop();
  helper.format.h3("Compare the existing collections against manifest_listed_collections: ");
  helper.format.codeStart();
  helper.format.text(existing_collection_names.arraysCompareV2(manifest_listed_collections));
  helper.format.codeStop();
  
  helper.format.h2("Eveluation of Collection names: only alphanumeric, dash and underscore are permitted");
  var lookup_matched = lookup_listed_collections.map(function(c){return c.match(collectionNameRegex)[0];});
  var lookup_compare_result = lookup_listed_collections.includesArray(lookup_matched);
  helper.format.h3("lookup table collection naming validation:");
  helper.format.h5("Number of Collections with permitted names");
  helper.format.text(lookup_compare_result.includes.length);
  if(lookup_compare_result.notIncluded.length == 0){
    helper.format.text("All the collection names passed the criteria.");
  }else{
    helper.format.text("List the first five examples that have unallowed symbols in the collection name: ");
    helper.format.codeStart();
    lookup_compare_result.notIncluded.splice(0,5).forEach(function(l){
      helper.format.text(l);
    });
    helper.format.codeStop();
  }
  var manifest_matched = manifest_listed_collections.map(function(c){return c.match(collectionNameRegex)[0];});
  var manifest_compare_result = manifest_listed_collections.includesArray(manifest_matched);
  helper.format.h3("manifest collection naming validation:");
  helper.format.h5("Number of Collections with permitted names");
  helper.format.text(manifest_compare_result.includes.length);
  if(manifest_compare_result.notIncluded.length == 0){
    helper.format.text("All the collection names passed the criteria.");
  }else{
    helper.format.text("List the first five examples that have unallowed symbols in the collection name: "); 
    helper.format.codeStart();
    manifest_compare_result.notIncluded.splice(0,5).forEach(function(l){
      helper.format.text(l);
    });
    helper.format.codeStop();
  }
  
  var collection_matched = existing_collection_names.map(function(c){return c.match(collectionNameRegex)[0];});
  var collection_compare_result = existing_collection_names.includesArray(collection_matched);
  helper.format.h3("Current database collection naming validation:");
  helper.format.h5("Number of Collections with permitted names");
  helper.format.text(collection_compare_result.includes.length);
  if(collection_compare_result.notIncluded.length == 0){
    helper.format.text("All the collection names passed the criteria.");
  }else{
    helper.format.text("List the first five examples that have unallowed symbols in the collection name: ");
    helper.format.codeStart();
    collection_compare_result.notIncluded.splice(0,5).forEach(function(l){
      helper.format.text(l);
    });
    helper.format.codeStop();
  }
  
  /*** survey the collections that exist in the tcga database
                                   listed in render_pca
                                   listed in render_patient
        
   ***/
  helper.format.h1("Part II: Checking rendering collections");
  helper.format.h3("render_pca compare to existing pcascores");
  collection = yield comongo.db.collection(db, 'render_pca');
  render_pca = yield collection.find({},{'disease':true, 'source':true, 'type':true, 'geneset':true}).toArray();
  
  var existing_pcascores = [];
  var rendering_pca_potential_collections = [];
  existing_collection_names.forEach(function(e){if(e.includes('pcascores') && (!e.includes("-1e+05") && (!e.includes("-1e05")))) existing_pcascores.push(e);});
  var existing_pca_removal = existing_pcascores.containPartialString(/[A-Za-z0-9_-]+-mut01/g);
  existing_pcascores = u.difference(existing_pcascores, existing_pca_removal);


  var pcascores_postfix = []; 
  existing_pcascores.forEach(function(e){pcascores_postfix.push(e.split("-")[e.split("-").length-1]);});
  pcascores_postfix = pcascores_postfix.unique();
  helper.format.text("Mapping from render_pca type to the pcascores name postfix:");
  helper.format.codeStart();
  helper.format.text(pcaScoreTypeMapping);
  helper.format.codeStop();
  helper.format.text("From the pcaScores collection names, the existing types lists below: ");
  helper.format.codeStart();
  helper.format.text(pcascores_postfix);
  helper.format.codeStop();
  // //render_pca_missing_collections.length: 264
  // var render_pca_missed_types = render_pca_missing_collections.map(function(r){return r.type;});
  // helper.format.text("Are there any types that render_pca doesn't include? :");
  // helper.format.codeStart();
  // helper.format.text(render_pca_missed_types.unique());
  // helper.format.codeStop();
  // // [ 'import',
  // 'gistic2thd',
  // 'mutation',
  // 'mutationBroadGene',
  // 'mutationBcmGene' ]
  //[ 'mut01', 'cnv', 'hm27', 'protein' ]


  render_pca.forEach(function(r){
    var str = r.disease + "_pcascores_" + r.source + "_prcomp-"+ r.geneset.replace(/ /g, "") + "-" + pcaScoreTypeMapping[r.type];
    if(typeof(pcaScoreTypeMapping[r.type]) == 'undefined'){
      console.log("******", r.type);
    }
    str = str.toLowerCase();
    rendering_pca_potential_collections.push(str);  
  });
  var rendering_pca_potential_removal = rendering_pca_potential_collections.containPartialString(/[A-Za-z0-9_-]+-mut01/g);
  rendering_pca_potential_collections = u.difference(rendering_pca_potential_collections, rendering_pca_potential_removal);

  helper.format.h3("Compare the existing collections against render_pca: ");
  helper.format.codeStart();
  helper.format.text(existing_pcascores.arraysCompareV2(rendering_pca_potential_collections));
  helper.format.codeStop();
  
  helper.format.h2("render_patient compare to existing mds");
  collection = yield comongo.db.collection(db, 'render_patient');
  render_patient = yield collection.find({type:"cluster"}, {'dataset':true, 'type':true, 'name':true, 'source':true}).toArray();
  var existing_mds = [];
  var rendering_pt_potential_collections = [];
  // var mdsSourceMapping = {
  //   "ucsc-pnas": "ucsc",
  //   "ucsc": "ucsc"
  // };
  existing_collection_names.forEach(function(e){if(e.includes('mds') && (!e.includes("-1e+05")) && (!e.includes("-1e05"))) existing_mds.push(e);});
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

  helper.format.h3("Compare the existing collections against render_patient: ");
  helper.format.codeStart();
  helper.format.text(existing_mds.arraysCompareV2(rendering_pt_potential_collections));
  helper.format.codeStop();
  helper.format.h3("Compare render_patient against the existing collections: ");
  helper.format.codeStart();
  helper.format.text(rendering_pt_potential_collections.arraysCompare(existing_mds));
  helper.format.codeComment("In render_patient, there are documents with 'cluster' as type, yet 'pca-' as name prefix.");
  helper.format.text(render_patient_weird_ex);
  helper.format.codeStop();

  //report the size of the molecular collections with the count lower than 1000
  helper.format.h1("Part III: Molecular collections size lower than 1000");
  helper.format.codeStart();
  if(collectionSize.filter(function(m){return m.type!='protein';}).length !=0){
    collectionSize.forEach(function(a){
      helper.format.text(a);
    });
  }else{
    helper.format.text("No Molecular Collection has significantly lower counts.");
  }
  helper.format.codeStop();
  //report the discrepancy between calculated and calculated category in lookup_oncoscape_datasources
  helper.format.h1("Part IV: The combination from Molecular Collections and genesets compared to the Calculated Collections in lookup_oncoscape_datasources");
  helper.format.text("/* Checking PCA/MDS Collections */");
  helper.format.text("MDS, mutation and copy number, all of them are genesets, check the names, look at each gene-set, from the same sources (mut, copy)");
  helper.format.text("PCA, for RNA, methylation, protein, CNV, for those molecular types, with each genesets. No PCA mutation combo");
  helper.format.codeComment("Removed 'dne' flagged collection along with their scaled collection and their corresponding pcaloadings collections(example below):");
  helper.format.codeComment("'gbm_pcascores_ucsc_prcomp-tcgagbmclassifiers-protein'");
  helper.format.codeComment("'gbm_pcascores_ucsc_prcomp-tcgagbmclassifiers-protein-1e05'");
  helper.format.codeComment("'gbm_pcaloadings_ucsc_prcomp-tcgagbmclassifiers-protein'");

  helper.format.codeStart();
  helper.format.codeComment("Reference is the Existing Calculated Collections.");
  validateCalculatedFromMolecular.forEach(function(a){
    helper.format.text(a);
  });
  helper.format.codeStop();

  // report the collection erros from ajv_tcga_v2.json 
  helper.format.h1("Part V: Data Structural Errors - Run the DB against schemas.json, below lists the error message: ");
  helper.format.codeStart();
  ajvMsg.forEach(function(a){
    if(a!=null && a.passedRate < 1){
      helper.format.text(a);
    }
  });
  helper.format.codeStop();
  
  // report disease collection structural status against brain in lookup_oncoscape_datasources
  // helper.format.h1("Part VI: Check disease collection structural status against brain in lookup_oncoscape_datasources");
  // var diseaseCollection = diseaseCollectionStructureStatus.filter(function(d){
  //                                             return (d.collectionStructural.length>0&&d.disease !='hg19'); }).map(function(m){
  //                                             var elem = {};
  //                                             elem.disease = m.disease;
  //                                             elem.errors = [];
  //                                             m.collectionStructural.forEach(function(n){
  //                                               elem.errors.push(n.schemaPath+'['+n.message + ']');
  //                                             });
  //                                             return elem;});
  // helper.format.codeStart();
  // helper.format.text(diseaseCollection);
  // helper.format.codeStop();
  // helper.format.h1("Part VI: Five Tools Testing Results:");
  // helper.format.codeStart();
  // helper.format.text(lookup_toolTesting);
  // helper.format.codeStop();

  helper.format.h1("Part VII: Check if there are any duplicated fields in Clinical Collections:");
  helper.format.codeStart();
  helper.format.text(duplicatedFields);
  helper.format.codeStop();  

  // report the earlier version patient ID checking
  helper.format.h1("Part VIII: Checked the patient IDs against disease patient collection IDs:");
  
  helper.format.h3("The aggregated result grouped by Disease types and Data Types");
  var diseasesWithPIDErros = u.uniq(patientID_status.map(function(m){return m.disease;}));
  helper.format.codeComment("Below lists the disease types, whose patient IDs in some if not all collections are NOT included in the clinical patient IDs.");
  helper.format.codeStart();
  helper.format.text(diseasesWithPIDErros);
  // [ 'lgg','brca','brain','lusc','hnsc','kirp','luad','gbm','thca','read',
  //   'thym','sarc','pcpg','kirc','coad','ov','paad','cesc','chol','esca',
  //   'tgct','blca','ucec','kich','stad','dlbc','lihc','prad','acc','laml',
  //   'coadread','skcm','lung' ]
  helper.format.codeComment("Below lists the disease types, whose patient IDs in all collections are included in the clinical patient IDs.");
  var totalDiseases = [ 'brain','lusc','hnsc','coadread','brca','gbm','lgg','luad','lung','prad','esca','dlbc','ucs','blca','coad','thca','acc','lihc','paad','ov','skcm','chol','kirc','read','kirp','meso','uvm','cesc','ucec','pcpg','thym','sarc','stad','tgct','kich','laml'];
  helper.format.text(u.difference(totalDiseases, diseasesWithPIDErros));
  // { overlapCount: 0,
  //   itemsNotInRef: [],
  //   refItemsNotInSelf: [ 'uvm', 'meso', 'ucs' ],
  //   countInRef: NaN }
  helper.format.codeStop();


  var typesWithPIDErros =  u.uniq(patientID_status.map(function(m){return m.type;}));
  helper.format.codeComment("Below lists the data types, whose patient IDs in some if not all collections are NOT included in the clinical patient IDs.");
  helper.format.codeStart();
  helper.format.text(typesWithPIDErros);
  // [ 'cnv','protein','events','mut','mds','mut01','edges','otherMalignancy',
  //   'pcaScores','methylation','rna','color','ptDegree' ]
  helper.format.codeComment("Below lists the data types, whose patient IDs in some if not all collections are NOT included in the clinical patient IDs.");
  var totalTypes =[ 'color','events','drug','newTumor','radiation','otherMalignancy','followUp','newTumor-followUp','pcascores','mds','edges','ptDegree' ];
  helper.format.text(u.difference(totalTypes, typesWithPIDErros));
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
  helper.format.codeStop();
  helper.format.text("Detailed aggregated report lists here (sorted by subfield IDstatus.itemsNotInRefLength):");
  var ptIDSum = Object.keys(u.groupBy(patientID_status, 'disease')).map(function(d){
    return patientID_status.filter(function(p){
      return p.disease == d;
    }).map(function(m){
      m.itemsNotInRef = m.IDstatus.itemsNotInRef;
      return u.omit(m,'type','IDstatus', 'itemsNotInRefLen');
    });
  }).map(function(p){
    var elem = {};
    elem.disease = p[0].disease;
    elem.ptIDNotInPatientTable = p.map(function(m){
      return m.itemsNotInRef;
    }).reduce(function(a,b){ 
    return a = a.concat(b).unique();});
    return elem;
  });
  helper.format.codeStart();
  ptIDSum.forEach(function(s){helper.format.text(s);});
  helper.format.codeStop();
  
  helper.format.h1("Part IX: Checked the gene symbols against HGNC gene symbols: ");
  helper.format.h3("The aggregated result grouped by Disease types and Data Types");
  var diseasesWithGeneIDErrors = u.uniq(gene_status.map(function(m){return m.disease;}));
  helper.format.codeComment("Below lists the disease types, whose gene symbols in some if not all collections are NOT included in the HGNC gene symbols");
  helper.format.codeStart();
  helper.format.text(diseasesWithGeneIDErrors);
  helper.format.codeComment("Below lists the disease types, whose gene symbols in all collections are included in the HGNC gene symbols");
  var totalDiseases = [ 'brain','lusc','hnsc','coadread','brca','gbm','lgg','luad','lung','prad','esca','dlbc','ucs','blca','coad','thca','acc','lihc','paad','ov','skcm','chol','kirc','read','kirp','meso','uvm','cesc','ucec','pcpg','thym','sarc','stad','tgct','kich','laml'];
  helper.format.text(u.difference(totalDiseases, diseasesWithGeneIDErrors));
  helper.format.codeStop();
  var typesWithGeneIDErros =  u.uniq(gene_status.map(function(m){return m.type;}));
  helper.format.codeComment("Below lists the data types, whose gene symbols in some if not all collections are NOT included in the HGNC gene symbols");
  helper.format.codeStart();
  helper.format.text(typesWithGeneIDErros);
  // [ 'cnv','protein','events','mut','mds','mut01','edges','otherMalignancy',
  //   'pcaScores','methylation','rna','color','ptDegree' ]
  helper.format.codeComment("Below lists the data types, whose gene symbols in some if not all collections are included in the HGNC gene symbols");
  var totalTypes =['mut','mut01','methylation','rna','protein','cnv','facs','genesets','annotation','genedegree','edges','genes','pcaloadings' ];   
  helper.format.text(u.difference(totalTypes, typesWithGeneIDErros));
  helper.format.codeStop();
  helper.format.text("First five collections with the most gene symbols that are not included in HGNC gene symbol list:");
  helper.format.codeStart();
  gene_status.filter(function(m){return m.type!="methylation" && m.type!="psi"}).splice(0, 5).forEach(function(s){helper.format.text(s);});
  helper.format.codeStop();
  
  helper.format.h1("Part X: Min/Max Values Checking in Molecular Collections: ");
  var errorMinMaxColls = molecularMinMaxChecking.map(function(m){return m.collection;}).unique();
  var mutColls = errorMinMaxColls.containPartialString(/_mut_/);
  var shorterMolMinMaxErrors = molecularMinMaxChecking.filter(function(m){return !mutColls.contains(m.collection);})
  var usedColls = shorterMolMinMaxErrors.map(function(m){return m.collection;}).unique();
  var errorReported = usedColls.map(function(m){
    var elem = {};
    elem.collection = m;
    var collectionErrors = shorterMolMinMaxErrors.filter(function(n){return n.collection == m;});
    elem.rangeErrorLength = collectionErrors.length;
    elem.errorExamples = collectionErrors.splice(0, 5);
    return elem;
  });
  helper.format.codeStart();
  errorReported.forEach(function(s){helper.format.text(s);});
  helper.format.codeStop();

  helper.format.h1("Part XI: X axis range checking for render_patient(>4600 listed below):");
  helper.format.codeStart();
  x_range.filter(function(m){return m.range>4600;}).forEach(function(s){helper.format.text(s);});
  helper.format.codeStop();


  yield comongo.db.close(db);
}).catch(onerror);


