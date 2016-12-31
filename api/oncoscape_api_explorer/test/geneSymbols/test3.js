var jsonfile = require("jsonfile");
var output2 = require("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/output2.json");
const u = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");

var output3 = output2.map(function(m){var elem = {};
	elem.collection = m.collection;
	elem.disease = m.disease;
	elem.type = m.type;
	elem.geneID_hugos = m.geneIDs_hugos;
	elem.geneID_symbols = m.geneID_symbols;
	elem.geneID_notIncludes = m.geneIDs_notIncludes.length;
	return elem;}).sort(function(a,b){return b.geneID_notIncludes-a.geneID_notIncludes;});
jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/output3.json", output3, {spaces: 2}, function(err){ console.error(err);});  

