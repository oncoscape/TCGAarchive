console.time();
var geneIDReporting = require('./output2.json');
var jsonfile = require("jsonfile");
var u = require("underscore");
var HGNC = require("./HGNC_complete.json");
var HGNC_geneSymbols = HGNC.response.docs.map(function(s){return s.symbol;});
var HGNC_genePrevSymbols = HGNC.response.docs.filter(function(s){return ("prev_symbol" in s);}).map(function(m){return m.prev_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneAliasSymbols = HGNC.response.docs.filter(function(s){return ("alias_symbol" in s);}).map(function(m){return m.alias_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneCosmicSymbols = HGNC.response.docs.filter(function(s){return ("cosmic" in s);}).map(function(m){return m.cosmic;});
var HGNC_geneCDSymbols = HGNC.response.docs.filter(function(s){return ("cd" in s);}).map(function(m){return m.cd;});
var HGNC_geneLNCRNADBSymbols = HGNC.response.docs.filter(function(s){return ("lncrnadb" in s);}).map(function(m){return m.lncrnadb;});

Array.prototype.includesArray = function(arr){
    var elem = {};
    var includes = [];
    var notIncludes = [];
    for(var i=0; i<this.length; i++){
        if(arr.indexOf(this[i]) > -1){
            includes.push(this[i]);
        }else{
            notIncludes.push(this[i]);
        }
    }
    elem.includes = includes;
    elem.notIncludes = notIncludes;
    return elem;
};

var geneIDErrors_brief = geneIDReporting.filter(function(m){
	return ('itemsNotInRef' in m.geneIDstatus) && (m.geneIDstatus.itemsNotInRef.length > 0);
}).map(function(m){
	console.log(m.collection);
	var elem = {};
	var el = {};
	var	notIncludes = m.geneIDstatus.itemsNotInRef;
	elem.collection = m.collection;
	elem.disease = m.disease;
	elem.type = m.type;
	el.countInRef = m.geneIDstatus.countInRef;
	el.itemsNotInHGNCSymbolsLength = notIncludes.length;
	el.itemsNotInHGNCSymbols = notIncludes.splice(0, 5);
	
	var withPrev = notIncludes.includesArray(HGNC_genePrevSymbols);
	var withAlias = notIncludes.includesArray(HGNC_geneAliasSymbols);
	var withCosmic = notIncludes.includesArray(HGNC_geneCosmicSymbols);
	var withCD = notIncludes.includesArray(HGNC_geneCDSymbols);
	var withLNCRNADB = notIncludes.includesArray(HGNC_geneLNCRNADBSymbols);
	
	el.NotInGeneSymButInPrevLength = withPrev.includes.length;
	el.NotInGeneSymButInAliasLength = withAlias.includes.length;
	el.NotInGeneSymButInCosmicLength = withCosmic.includes.length;
	el.NotInGeneSymButInCDLength = withCD.includes.length;
	el.NotInGeneSymButInLNCRNADBLength = withLNCRNADB.includes.length;
	el.NotInAny = u.intersection(withPrev.notIncludes, withAlias.notIncludes, withCosmic.notIncludes, withCD.notIncludes, withLNCRNADB.notIncludes);

	elem.geneIDstatus = el;
	return elem;
}).sort(function(a, b){
	return b.geneIDstatus.itemsNotInHGNCSymbolsLength - a.geneIDstatus.itemsNotInHGNCSymbolsLength;
});

jsonfile.writeFile("geneIDstatus_errors_brief.json", geneIDErrors_brief,  {spaces: 4}, function(err){ console.error(err);}); 
console.timeEnd();




