//Test_PCA.js
var exports = module.exports = {};

exports.ExecTest = function(disease, ajvMsg){
	var clinicalTypes = [
						 "patient", 
						 "drug", 
						 "newTumor", 
						 "otherMalignancy-v4p0",
						 "radiation",
						 "followUp-v1p0",
						 "followUp-v1p5",
						 "followUp-v2p1",
						 "followUp-v4p0",
						 "followUp-v4p8",
						 "followUp-v4p4",
						 "newTumor-followUp-v4p0",
						 "newTumor-followUp-v4p8",
						 "newTumor-followUp-v4p4"
						];
	var p = [];

	clinicalTypes.forEach(function(t){
		p = p.concat(ajvMsg.findScoreByDiseaseByType(t, disease));
	});
    return p.some(function(e){return e!=0;});
};

