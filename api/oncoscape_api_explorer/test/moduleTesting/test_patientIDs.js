//test_patientIDs.js

var jsonfile = require("jsonfile");
const mongoose = require("mongoose");
var dataTypes_ptIDsAsNestedValues = ['color', 'edges'];
var dataTypes_ptIDsAsValues = ['patient', 'drug', 'newTumor', 'otherMalignancy-v4p0', 'radiation', 'followUp-v1p0',
                               'followUp-v1p5', 'followUp-v2p1', 'followUp-v4p0', 'followUp-v4p8', 'followUp-v4p4',
                               'newTumor-followUp-v4p0', 'newTumor-followUp-v4p8', 'newTumor-followUp-v4p4'];
var dataTypes_ptIDsAsKeys = ['mut', 'mut01', 'events', 'methylation', 'rna', 'protein', 'psi', 'facs', 'cnv', 'pcaScores',
                             'pcaLoadings', 'mds', 'ptDegree', 'geneDegree'];


Array.prototype.arraysCompare = function(ref) {
    var elem = {};
    elem.countInRef = 0;
    elem.itemsNotInRef = [];
    for(var i = 0; i < this.length; i++) {
        if(ref.indexOf(this[i]) > -1){
          elem.countInRef++;
        }else{
          elem.itemsNotInRef.push(this[i]);
        }
    }
    return elem;
};


var exports = module.exports = {};
exports.ExecTest = function(disease, ajvMsg, ptList){
	var p = ajvMsg.findCollectionsByDisease(disease);

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
	var col_count = 0;
	connection.once('open', function(){
	    var db = connection.db; 
	    asyncLoop(dataType, function(t, next){  
	      console.log("Within datatype: ", t);
	      var categoried_collections = collections.findCollectionsByType(t); 
	      var categoried_collection_length = categoried_collections.length; 
	      var category_index = 0;

	      /*
	       */

	    }, function (err)
	    {
	        if (err)
	        {
	            console.error('Error: ' + err.message);
	            return;
	        }
	     
	        console.log('Finished!');
	    });

	});
};






