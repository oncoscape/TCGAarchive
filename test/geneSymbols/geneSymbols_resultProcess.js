var output = require("./output.json");
var HGNC = require("./HGNC_complete.json");
var HGNC_geneSymbols = HGNC.response.docs.map(function(s){return s.symbol;});
var trimmedOutput = output.filter(function(m){return ('geneIDs' in m);});

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
		elem.geneIDstatus = {};
		elem.geneIDstatus = o.geneIDs.arraysCompare(HGNC_geneSymbols);
		console.log(JSON.stringify(elem, null, 4));
	});


