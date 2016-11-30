const helper = require("../testingHelper.js");
const u = require("underscore");
const jsonfile = require("jsonfile");
var lookup = require("../lookup_arr.json");
var render_pca = require("../render_pca.json");
var render_patient = require("../render_patient.json");

var diseases_markers = render_patient.map(function(m){return m.dataset;}).unique();
var diseseas_pca = render_pca.map(function(m){return m.disease;}).unique();


lookup.forEach(function(l){
	l.tools_jz = [];
	//Spreadsheet
	if('clinical' in l && u.without(Object.keys(l.clinical), 'events').length > 1){
		l.tools_jz.push('history');
	}
	//Timeline
	if('clinical' in l && 'events' in l.clinical){
		l.tools_jz.push('timelines');
	}
	
	if(diseases_markers.contains(l.disease)){
		l.tools_jz.push('markers');
	}
	if(diseseas_pca.contains(l.disease)){
		l.tools_jz.push('pca');
	}
    l.tools_jz.push('survival');
});
lookup = lookup.map(function(m){
	var elem = {};
	elem.disease = m.disease;
	//elem.tools = m.tools;
	//elem.tools_jz = m.tools_jz;
	if('tools' in m)
	elem.tools_missing =  m.tools.arraysCompare(m.tools_jz).itemsNotInRef;
	return elem;
}).filter(function(m){
	if('tools_missing' in m){
		return m.tools_missing.length > 0;
	}
});



jsonfile.writeFile("lookup.json", lookup,  {spaces: 4}, function(err){ console.error(err);}); 

/* Spreadsheet
   Criteria
   - 'clinical' in lookup Item
   -  not only 'events' in 'clinical'	
*/

/* PCA
Obervation: from Dev/Test, brain PCA type has -import, is it an error?

	db.getCollection('render_pca').distinct('type')
	[
	    "cnv-gistic",
	    "-import",
	    "cnv-gistic2thd",
	    "mut01-mutation",
	    "mut01-mutationBroadGene",
	    "-mut01-mutationBroadGene",
	    "mut01-mutationBcmGene",
	    "mut01-mutationCuratedWustlGene",
	    "rna-HiSeq",
	    "protein-RPPA",
	    "mut01-broadcurated",
	    "mut01-ucsc"
	]
	db.getCollection('render_pca').distinct('source')
	[
	    "ucsc-PNAS",
	    "ucsc"
	]
*/
