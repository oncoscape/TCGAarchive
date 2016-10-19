//Test_PCA.js
var exports = module.exports = {};

exports.ExecTest = function(disease, ajvMsg){
	var p = ajvMsg.findScoreByDiseaseByType('pcaScores', disease);
      // if(p.some(function(e){return e!=0;})){
      //   elem['PCA'] = "This dataset can run on PCA✔️😃";
      // }else{
      //   elem['PCA'] = "This dataset CANNOT run on PCA❌";
      // }
    return p.some(function(e){return e!=0;});
};

