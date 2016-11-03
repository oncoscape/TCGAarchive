var geneIDReporting = require('./output2.json');
var jsonfile = require("jsonfile");
var u = require("underscore");
var geneIDErrors_brief = geneIDReporting.filter(function(m){
	return ('itemsNotInRef' in m.geneIDstatus) && (m.geneIDstatus.itemsNotInRef.length > 0);
}).map(function(m){
	var elem = {};
	var el = {};
	elem.collection = m.collection;
	elem.disease = m.disease;
	elem.type = m.type;
	el.countInRef = m.geneIDstatus.countInRef;
	el.itemsNotInRefLength = m.geneIDstatus.itemsNotInRef.length;
	el.itemsNotInRef = m.geneIDstatus.itemsNotInRef.splice(0, 5);
	elem.geneIDstatus = el;
	return elem;
});


geneIDErrors_brief.sort(function(a, b){
	return b.geneIDstatus.itemsNotInRefLength - a.geneIDstatus.itemsNotInRefLength;
});

jsonfile.writeFile("geneIDstatus_errors_brief.json", geneIDErrors_brief,  {spaces: 4}, function(err){ console.error(err);}); 

