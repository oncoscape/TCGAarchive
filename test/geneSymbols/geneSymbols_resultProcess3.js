var jsonfile = require("jsonfile");
var output2 = require("./output2.json");
const u = require("underscore");
const helper = require("../testingHelper.js");

var output3 = output2.map(function(m){var elem = {};
	elem.collection = m.collection;
	elem.disease = m.disease;
	elem.type = m.type;
	elem.geneID_hugos = m.geneIDs_hugos;
	elem.geneID_symbols = m.geneID_symbols;
	elem.geneID_notIncludes = m.geneIDs_notIncludes.length;
	return elem;}).sort(function(a,b){return b.geneID_notIncludes-a.geneID_notIncludes;});
jsonfile.writeFile("output3.json", output3, {spaces: 2}, function(err){ console.error(err);});  

// var geneSymbolErrors = output3.filter(function(m){return m.geneID_notIncludes > 0;});//.length;//217
// geneSymbolErrors.map(function(m){return m.type;}).unique().length
// 12
// output2.map(function(m){return m.type;}).unique().length
// 12
// geneSymbolErrors.map(function(m){return m.disease;}).unique().length
// 37
// output2.map(function(m){return m.disease;}).unique().length
// 37
