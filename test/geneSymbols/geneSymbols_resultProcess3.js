const u = require("underscore");
const helper = require("../testingHelper.js");
const jsonfile = require("jsonfile-promised");
const vega = require("./vega_light.json");

var output = require("./geneIDstatus_errors_brief.json");
var NotInAny = [];
var result = output.map(function(m){return m.geneIDstatus.NotInAny;})
				   .reduce(function(a, b){
						
					    NotInAny = u.uniq(a.concat(b));
					    return NotInAny;
					    });
				//    .sort(function(a, b){return (b-a);});

jsonfile.writeFile("notAnnotatedGenes.json", result.sort(function(a,b){return b-a}), {spaces: 4}); 

output.map(function(m){
	var notInAny = m.geneIDstatus.NotInAny;
	var el = {};
	el = notInAny.includesArray(vega);
	m.geneIDstatus.vega = el;
	return m;
});
jsonfile.writeFile("geneIDstatus_errors_vega.json", output, {spaces: 4});


