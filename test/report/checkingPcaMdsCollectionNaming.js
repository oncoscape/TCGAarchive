/* 
  Checking PCA/MDS Collections    
*/
// MDS, mutation and copy number, all of them are genesets
// check the names, 
// look at each gene-set, from the same sources (mut, copy)
// PCA, for RNA, methylation, protein, CNV, for those molecular types, with each genesets


var jsonfile = require("jsonfile");
var comongo = require('co-mongodb');
var co = require('co');
const u = require("underscore");
const helper = require("../testingHelper.js");
var elem = [];
var db, collection, collections, collection_names;
var lookup_table;
var genesets, genesetsStrings;
var mds_sub_arrays;
var onerror = function(e){
    console.log(e);
};

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ'+
    '@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,'+
    'oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');

  collection = yield comongo.db.collection(db, 'lookup_oncoscape_datasources');
  lookup_table = yield collection.find({}).toArray();
  collection = yield comongo.db.collection(db, 'hg19_genesets_hgnc_import');
  genesets = yield collection.distinct('name');
  genesetsStrings = yield genesets.map(function(g){ return g.toLowerCase().replace(/\s/g, '');});

  var molComboForCalculated = function(lookupItem){
    // by data sources
    var result = [];
    // var datasources = lookupItem.molecular.map(function(m){return m.source;}).unique();
    var molGrpBySource = u.groupBy(lookupItem.molecular, "source");

    Object.keys(molGrpBySource).forEach(function(k){
      console.log(k);
      if(molGrpBySource[k].map(function(m){return m.type;}).includesArray(['mut01','cnv']).includes.length==2){
        //can calculate MDS  
       mds_sub_arrays = genesetsStrings.map(function(g){ return lookupItem.disease + "_mds_" + k + "_mds-" + g + "-cnv-mut01-" + k;});
       //console.log(mds_sub_arrays);
       result = result.concat(mds_sub_arrays);
      }
      

    });
    return result;
  }
 lookup_table.forEach(function(l){
   var molecularCombinations = molComboForCalculated(l);
   console.log(molecularCombinations);
  //  var currentCalculatedCollections = l.calculated.map(function(m){return m.collection;});
  //  console.log(molecularCombinations.arraysCompareV2(currentCalculatedCollections));
 });
//   collections = yield comongo.db.collections(db);
//   collection_names = collections.map(function(c){return c['s']['name'];});
  
  
  
  yield comongo.db.close(db);
}).catch(onerror);

