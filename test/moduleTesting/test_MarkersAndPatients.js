//test_MarkersAndPatients.js

/*  check Patient IDs
 	from lookup_oncoscape_datasources.disease.category[]: type==color
 	from lookup_oncoscape_datasources.disease.color: all the collections
 	
 */
var exports = module.exports = {};

var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var jsonfile = require('jsonfile');
var schemas = {};
var ptList;
var ajvMsg;

jsonfile.readFile("ptList.json", function(err, obj){
	ptList = obj;
});

jsonfile.readFile("ajv_1012_v2.json", function(err, obj){
	ajvMsg = obj;
});
const mongoose = require("mongoose");

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

var status = [];
var disease = 'brca';
var db = connection.db; 
var ptIDs = ptList[disease];
var ajv_disease = ajvMsg.findCollectionsByDisease(disease);


connection.once('open', function(){
    var db = connection.db; 
});


exports.ExecTest = function(disease, ptList, ajvMsg){
	// checking patient IDs across all the required collections
	
	var status = [];
	var disease = 'brca';
	var db = connection.db; 

	if(ptList[disease].length != 0){
		var ptIDs = ptList[disease];
		var ajv_disease = ajvMsg.findCollectionsByDisease(disease);
		// ajv_disease.forEach(function(a){
		// 	var t = a.type; 
		// 	console.log(t);
		// });
		for(var i=0; i<ajv_disease.length;i++){
			var a = ajv_disease[i];
			var t = a.type;
			console.log(t);
			
			switch(t){
				    case "mut" :
				    case "mut01":
				    case "methylation":
				    case "rna":
				    case "protein":
				    case "cnv":
				    	{
				    		var cursor = db.collection(a.collection).find();
				    		var elem = {};
				    		elem = a;
				    		elem.ptIDStatus = [];
				    		console.log('within color');
				    		cursor.each(function(err, item){
					          if(item != null){
					            if(('patients' in item) && (Object.keys(item.patients).arraysCompare(ptIDs).itemsNotInRef.length != 0))
					          		elem.ptIDStatus.push(Object.keys(item.patients).arraysCompare(ptIDs).itemsNotInRef.length);
					          }
					        });
					        status.push(elem);
				    	}
				    case "patient":
				    case "drug":
				    case "newTumor":
				    case "otherMalignancy-v4p0":
				    case "radiation":
				    case "followUp-v1p5":
				    case "followUp-v2p1":
				    case "followUp-v4p0":
				    case "newTumor-followUp-v4p0":
				    default:
				    	console.log(t);
			}	
				        
		}
		return status;
	}else{
		return false;
	}
};



jsonfile.writeFile("ptIDs.json", status, {spaces: 4}, function(err){console.log(err);});


