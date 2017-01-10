/* 
  Checking PCA/MDS Collections    
*/
// MDS, mutation and copy number, all of them are genesets
// check the names, 
// look at each gene-set, from the same sources (mut, copy)
// PCA, for RNA, methylation, protein, CNV, for those molecular types, with each genesets
// No PCA mutation combo


var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
const u = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
var elem = [];
var db, collection, collections, collection_names;
var lookup_table;
var manifest;
var genesets, genesetsStrings;
var mds_sub_arrays;
var elem = {};
var final_result = [];
var onerror = function(e){
    console.log(e);
};

function cartesianProductOf() {
  return u.reduce(arguments, function(a, b) {
      return u.flatten(u.map(a, function(x) {
          return u.map(b, function(y) {
              return x.concat([y]);
          });
      }), true);
  }, [ [] ]);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
  lookup_table = yield collection.find({}).toArray();
  collection = yield comongo.db.collection(db, 'manifest');
  manifest = yield collection.find({}).toArray();
  collection = yield comongo.db.collection(db, 'hg19_genesets_hgnc_import');
  genesets = yield collection.distinct('name');
  genesetsStrings = yield genesets.map(function(g){ return g.toLowerCase().replace(/\s/g, '');});

  var ExcludedCollections = manifest.filter(function(m){return ('dne' in m);}).map(function(f){return f.collection;});
  var ExcludedCollectionsScaled = ExcludedCollections.map(function(cn){
      return cn + "-1e05";
  });
  var ExcludedCollectionsPcaloadings = ExcludedCollections.map(function(cn){
      return cn.replace("pcascores", "pcaloadings");
  });
  ExcludedCollections = ExcludedCollections.concat(ExcludedCollectionsScaled, ExcludedCollectionsPcaloadings);
  var molComboForCalculated = function(lookupItem){
    // by data sources
    var result = [];
    // var datasources = lookupItem.molecular.map(function(m){return m.source;}).unique();
    var molGrpBySource = u.groupBy(lookupItem.molecular, "source");

    Object.keys(molGrpBySource).forEach(function(k){
      //console.log(k);
      if(molGrpBySource[k].map(function(m){return m.type;}).includesArray(['mut01','cnv']).includes.length==2){
        //can calculate MDS  
       mds_sub_arrays = genesetsStrings.map(function(g){ return lookupItem.disease + "_mds_" + k + "_mds-" + g + "-cnv-mut01-" + k;});
       //console.log(mds_sub_arrays);
       result = result.concat(mds_sub_arrays);
      }
      //pcaloading and pcascore
      //console.log(cartesianProductOf([1, 2, 3], ['a', 'b']));
      var molCom = molGrpBySource[k].filter(function(m){return (m.type != 'mut01' && m.type != 'mut' && m.type != 'psi');}).map(function(m){
        var str = m.collection.split("_");
        var res;
        if(m.type == "rna" || m.type == "methylation"){
          res = str[1]+"-"+str[3];
        }else{
          res = m.type;
        }
        return res;
      });

      var cartesianProd = cartesianProductOf(genesetsStrings, molCom);

      cartesianProd.forEach(function(c){
        var str1 = lookupItem.disease + "_pcascores_" + k.toLowerCase() + "_prcomp-" + c[0] + "-" + c[1];
        var str1Scale = str1 + "-1e05";
        var str2 = lookupItem.disease + "_pcaloadings_" + k.toLowerCase() + "_prcomp-" + c[0] + "-" + c[1];
        var str2Scale = str1 + "-1e05";
        result = result.concat([str1, str1Scale, str2, str2Scale]);
      });

      });
    return result;
  };
  
 final_result = lookup_table.map(function(l){
   elem = {};
   elem.disease = l.disease;
   if('molecular' in l && 'calculated' in l){
      var molecularCombinations = molComboForCalculated(l);
      var currentCalculatedCollections = l.calculated.map(function(m){return m.collection;});
      var currentCalculatedMutColls = currentCalculatedCollections.containPartialString(/-mut01/);
      currentCalculatedCollections = u.difference(currentCalculatedCollections, currentCalculatedMutColls);
      var evaluation = molecularCombinations.arraysCompareV2(currentCalculatedCollections);
      //evaluation.NotCalculated = evaluation.itemsNotInRef.includesArray(ExcludedCollections).includes;
      evaluation.itemsNotInRef = u.difference(evaluation.itemsNotInRef,evaluation.NotCalculated);
      elem.possibleMolecularCombination = evaluation;
   }
    return elem;
 });
 jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/validateCalculatedFromMolecular.json", final_result, {spaces:4}, function(err){ console.error(err);});
  yield comongo.db.close(db);
}).catch(onerror);
