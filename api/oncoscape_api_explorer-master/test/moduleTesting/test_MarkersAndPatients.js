//test_MarkersAndPatients.js

/*  check Patient IDs
 	from lookup_oncoscape_datasources.disease.category[]: type==color
 	from lookup_oncoscape_datasources.disease.color: all the collections
 	
 */
var exports = module.exports = {};

var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var schemas = {};


mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var connection = mongoose.connection;
connection.once('open', function(){
    var db = connection.db; 
    

});

exports.ExecTest = function(disease, ptList, ajvMsg){
	// checking patient IDs across all the required collections
	
	if(ptList[disease].length != 0){
		var ptIDs = ptList[disease];
		ajvMsg.findCollectionsByDisease(disease).map(function(a){
			patientIDsEval(disease, a, ptList[disease]);
		});
	}else{
		return false;
	}
};

var patientIDsEval = function(disease, ajvMsgElem, ref){
	switch(ajvMsgElem.type) {
		    case "color":
		    	{
		    		var collection = db.collection(ajvMsgElem.collection);
		    		var cursor = collection.find();
		    		cursor.each(function(err, item){
			          if(item != null){
			            item.data.forEach(function(e){
			            	e.value.arraysCompare(ref);
			            });
			          }
			        });
		    	}
		        break;
		    case "mut" :
		    case "mut01":
		    case "methylation":
		    case "rna":
		    case "protein":
		    case "cnv":
		        break;
		    case "patient":
		    case "drug":
		    case "newTumor":
		    case "otherMalignancy-v4p0":
		    case "radiation":
		    case "followUp-v1p5":
		    case "followUp-v2p1":
		    case "followUp-v4p0":
		    case "newTumor-followUp-v4p0":
		    	{
		    		var collection = db.collection(ajvMsgElem.collection);
		    		var cursor = collection.find();
		    		cursor.each(function(err, item){
			          if(item != null){
			            item.data.forEach(function(e){
			            	e.value.arraysCompare(ref);
			            });
			          }
			        });	
		    	}
		    	break;
		    case "pcaScores":
		    case "mds":
		    case "edges":
		    case "ptDegree":
		    case "geneDegree":
		    	break;
		    default:
		    	break;
		}
}