//Test_PCA.js
var exports = module.exports = {};

//exports.ExecTest = function(disease, ajvMsg){
	// var p = ajvMsg.findScoreByDiseaseByType('pcaScores', disease);
 	// return p.some(function(e){return e!=0;});

//};

exports.ExecTest = function(disease, render_pca_diseases){
	if(render_pca_diseases.indexOf(disease) > -1){
		return true;
	}else{
		return false;
	}
};
