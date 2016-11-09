console.time();
const output = require("./output.json");
const u = require("underscore");
const helper = require("../testingHelper.js");
const input = require("../datasourceTesting/ajv_tcga_v2_11072016.json");
var HGNC = require("./HGNC_complete.json");
var HGNC_geneSymbols = HGNC.response.docs.map(function(s){return s.symbol;});
var HGNC_genePrevSymbols = HGNC.response.docs.filter(function(s){return ("prev_symbol" in s);}).map(function(m){return m.prev_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneAliasSymbols = HGNC.response.docs.filter(function(s){return ("alias_symbol" in s);}).map(function(m){return m.alias_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneCosmicSymbols = HGNC.response.docs.filter(function(s){return ("cosmic" in s);}).map(function(m){return m.cosmic;});
var HGNC_geneCDSymbols = HGNC.response.docs.filter(function(s){return ("cd" in s);}).map(function(m){return m.cd;});
var HGNC_geneLNCRNADBSymbols = HGNC.response.docs.filter(function(s){return ("lncrnadb" in s);}).map(function(m){return m.lncrnadb;});
var HGNC_AllFields = HGNC.response.docs.map(function(d){return Object.keys(d);}).reduce(function(a, b){return u.uniq(a.concat(b));});
var HGCN_CommonFields = HGNC.response.docs.map(function(d){return Object.keys(d);}).reduce(function(a, b){return u.intersection(a,b);});
var trimmedOutput = output.filter(function(m){return ('geneIDs' in m);});//only return the collections with genes

var elem = {};
trimmedOutput.forEach(function(o){
		elem.collection = o.collection;
		elem.disease = o.disease;
		elem.type = o.type;
	  console.log(o.geneIDs.arraysCompare(HGNC_geneSymbols).countInRef);
});
console.timeEnd();
