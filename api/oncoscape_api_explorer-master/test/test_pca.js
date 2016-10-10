//Test_PCA.js
var exports = module.exports = {};

exports.ExecTest = function(disease, ajvMsg){
	var p = ajvMsg.findScoreByDiseaseByType('pcaScores', disease);
    return p.some(function(e){return e!=0;});
};

