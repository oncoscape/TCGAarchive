const u = require("underscore");
const jsonfile = require("jsonfile-promised");
const helper = require("../testingHelper.js");
const output = require("./output.json");
const ptList = require("./ptList.json");
var result =[];
var elem = {};
var index = 0;
var output_length = output.length;

var output_diseases = output.map(function(m){return m.disease}).unique();
var ptList_diseases = Object.keys(ptList);
u.difference(output_diseases, ptList_diseases);
//[ 'coadread', 'lung', 'hg19' ]
ptList.lung = ptList.lusc.concat(ptList.luad);
ptList.coadread = ptList.coad.concat(ptList.read);


console.log("[");
output.forEach(function(o){
		index++;
		elem.collection = o.collection;
		elem.disease = o.disease;
		elem.type = o.type;
		elem.IDstatus = {};
		if('IDs' in o){
			elem.IDstatus = o.IDs.arraysCompareV2(ptList[o.disease]);
		}
		console.log(JSON.stringify(elem, null, 4));
		if(index < output_length){
			console.log(",");	
		}
	});
console.log("]");





