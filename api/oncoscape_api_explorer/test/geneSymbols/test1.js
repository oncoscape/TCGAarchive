const output = require("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/output.json");
const u = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");

var HGNC = require("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/lookup_oncoscape_genes.json");
var HGNC_hugos = HGNC.map(function(h){return h.hugo;});
var HGNC_symbols = HGNC.map(function(h){return h.symbols;}).reduce(function(a, b){
    return a = a.concat(b);
});

var trimmedOutput = output.filter(function(m){return ('geneIDs' in m);});//only return the collections with genes

var elem = {};
var index = 0;
var output_length = trimmedOutput.length;
console.log("[");
trimmedOutput.forEach(function(o){
  //console.log(o.geneIDs.length);
  index++;
  elem = {};
  elem.collection = o.collection;
  elem.disease = o.disease;
  elem.type = o.type;
  if(o.geneIDs.length!=0){
    elem.geneIDs_hugos = o.geneIDs.arraysCompare(HGNC_hugos).countInRef;
    var sym =  HGNC_symbols.includesArray(o.geneIDs).includes;
    elem.geneID_symbols = sym.length;
    elem.geneIDs_notIncludes = u.difference(o.geneIDs, sym);
    
  }else{
    elem.geneID_length = 0;
  }
  console.log(JSON.stringify(elem, null, 4));
  if(index < output_length){
    console.log(","); 
  }
});
console.log("]");
// console.timeEnd(); //undefined: 7853130.479ms
