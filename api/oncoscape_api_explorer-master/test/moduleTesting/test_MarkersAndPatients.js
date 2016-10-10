//test_MarkersAndPatients.js

/*  check Patient IDs
 	from lookup_oncoscape_datasources.disease.category[]: type==color
 	from lookup_oncoscape_datasources.disease.color: all the collections
 	
 */
var exports = module.exports = {};

var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var schemas = {};
exports.ExecTest = function(disease, disease_arr, ajvMsg, render_chr, render_pt){
	// checking patient IDs across all the required collections
	var elem = {};
	for(var i=0;i<disease_arr.length;i++){
		if(disease_arr[i].disease == disease){
			elem = disease_arr[i];
		}
	}
	if('patientIDs' in elem){
		schemas.enum = [];
		schemas.enum = elem.patientIDs.unique();
	}else{
		return false;
	}
};

