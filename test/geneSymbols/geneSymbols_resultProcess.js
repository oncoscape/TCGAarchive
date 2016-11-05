var output = require("./output.json");
var u = require("underscore");
var HGNC = require("./HGNC_complete.json");
var HGNC_geneSymbols = HGNC.response.docs.map(function(s){return s.symbol;});
var HGNC_genePrevSymbols = HGNC.response.docs.filter(function(s){return ("prev_symbol" in s);}).map(function(m){return m.prev_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneAliasSymbols = HGNC.response.docs.filter(function(s){return ("alias_symbol" in s);}).map(function(m){return m.alias_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneCosmicSymbols = HGNC.response.docs.filter(function(s){return ("cosmic" in s);}).map(function(m){return m.cosmic;});
var HGNC_geneCDSymbols = HGNC.response.docs.filter(function(s){return ("cd" in s);}).map(function(m){return m.cd;});
var HGNC_geneLNCRNADBSymbols = HGNC.response.docs.filter(function(s){return ("lncrnadb" in s);}).map(function(m){return m.lncrnadb;});

//var HGNC_all = u.uniq(HGNC_geneSymbols.concat(HGNC_genePrevSymbols, HGNC_geneAliasSymbols, HGNC_geneCosmicSymbols, HGNC_geneCDSymbols, HGNC_geneLNCRNADBSymbols));

var HGNC_AllFields = HGNC.response.docs.map(function(d){return Object.keys(d);}).reduce(function(a, b){return u.uniq(a.concat(b));});
var HGCN_CommonFields = HGNC.response.docs.map(function(d){return Object.keys(d);}).reduce(function(a, b){return u.intersection(a,b);});

var trimmedOutput = output.filter(function(m){return ('geneIDs' in m);});//only return the collections with genes

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

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(arr.indexOf(this[i]) === -1) {
            arr.push(this[i]);
        }
    }
    return arr; 
};

var elem = {};
trimmedOutput.forEach(function(o){
		elem.collection = o.collection;
		elem.disease = o.disease;
		elem.type = o.type;
		//elem.geneIDstatus = {};
        console.log(o.geneIDs.arraysCompare(HGNC_geneLNCRNADBSymbols).countInRef);
		// elem.geneIDstatus = o.geneIDs.arraysCompare(HGNC_geneSymbols);
  //       if(elem.geneIDstatus.itemsNotInRef.length > 0){
  //           var notIncluded = elem.geneIDstatus.itemsNotInRef;
  //           elem.geneIDstatus.HGNC_genePrev = notIncluded.includesArray(HGNC_genePrevSymbols);
  //           elem.geneIDstatus.HGNC_geneAlias = notIncluded.includesArray(HGNC_geneAliasSymbols);
  //           elem.geneIDstatus.HGNC_geneCosmic = notIncluded.includesArray(HGNC_geneCosmicSymbols);
  //           elem.geneIDstatus.HGNC_geneCD = notIncluded.includesArray(HGNC_geneCDSymbols);
  //           elem.geneIDstatus.HGNC_geneLNCRNADB = notIncluded.includesArray(HGNC_geneLNCRNADBSymbols);
  //       }
		//console.log(JSON.stringify(elem, null, 4));
	});


