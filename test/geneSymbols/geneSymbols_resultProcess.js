const output = require("./output.json");
const u = require("underscore");
const helper = require("../testingHelper.js");
var HGNC = require("./lookup_oncoscape_genes.json");
// var HGNC = require("./HGNC_complete.json");
// var HGNC_geneSymbols = HGNC.response.docs.map(function(s){return s.symbol;});
// var HGNC_genePrevSymbols = HGNC.response.docs.filter(function(s){return ("prev_symbol" in s);}).map(function(m){return m.prev_symbol;}).reduce(function(a, b){return a.concat(b);});
// var HGNC_geneAliasSymbols = HGNC.response.docs.filter(function(s){return ("alias_symbol" in s);}).map(function(m){return m.alias_symbol;}).reduce(function(a, b){return a.concat(b);});
// var HGNC_geneCosmicSymbols = HGNC.response.docs.filter(function(s){return ("cosmic" in s);}).map(function(m){return m.cosmic;});
// var HGNC_geneCDSymbols = HGNC.response.docs.filter(function(s){return ("cd" in s);}).map(function(m){return m.cd;});
// var HGNC_geneLNCRNADBSymbols = HGNC.response.docs.filter(function(s){return ("lncrnadb" in s);}).map(function(m){return m.lncrnadb;});
// var HGNC_AllFields = HGNC.response.docs.map(function(d){return Object.keys(d);}).reduce(function(a, b){return u.uniq(a.concat(b));});
// var HGCN_CommonFields = HGNC.response.docs.map(function(d){return Object.keys(d);}).reduce(function(a, b){return u.intersection(a,b);});
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
	elem.collection = o.collection;
	elem.disease = o.disease;
	elem.type = o.type;
	elem.geneIDs_hugos = o.geneIDs.arraysCompare(HGNC_hugos);
	elem.geneIDs_symbols = o.geneIDs.arraysCompare(HGNC_symbols);
	console.log(JSON.stringify(elem, null, 4));
	if(index < output_length){
		console.log(",");	
	}
});
console.log("]");
