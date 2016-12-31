//test_Sunburst.js

/* pancan12.manifest file doesn't have type called 'facs'
   yet some diseases do have facs table listed unter molecular in the lookup file
   the existing collection number is 1563 (Oct 6th, 2016)
   1448 registered in manifest files

 */
var exports = module.exports = {};

exports.ExecTest = function(disease, disease_arr){
	var elem = {};
	for(var i=0; i<disease_arr.length; i++){
		if(disease_arr[i].disease == disease){
			elem = disease_arr[i];
		}
	}
	if(elem == null){
		return false;
	}else{
		if('molecular' in elem){
			if(Object.keys(elem.molecular).indexOf('facs') != -1){
				return true;
			}else{
				return false;
			}
		}else{	
			return false;
		}
	}
};

