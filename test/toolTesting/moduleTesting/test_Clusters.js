//test_Clusters.js
var exports = module.exports = {};

exports.ExecTest = function(disease, ajvMsg){
	var p = [];
	p = ajvMsg.findScoreByDiseaseByType("mds", disease);
	return (p.filter(function(a){return a>0;}).length > 9);
};

