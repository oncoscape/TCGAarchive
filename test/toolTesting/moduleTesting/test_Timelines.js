//test_Timelines.js

/* pancan12.manifest file doesn't have type called 'events'
   yet some diseases do have events table listed unter clnical in the lookup file
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
		if('clinical' in elem){
			if(Object.keys(elem.clinical).indexOf('events') != -1){
				return true;
			}else{
				return false;
			}
		}else{	
			return false;
		}
	}
};

