const comongo = require('co-mongodb');
const co = require('co');
var onError = function(e){ console.log(e); }

co(function *() {

var result,
collection, collections, 
fields, field;

// Connect To Database
var db = yield comongo.client.connect('');

// Read Diseases From Database That Are Not In Beta
collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
diseases = yield collection.find({beta:false, disease: {$ne: "hg19"}}).toArray();
//diseases = yield collection.find({beta:false, disease: "brain"}).toArray();

var tables = ["newtumor" ,"newtumor-followup","othermalignancy","followup"]

// Loop Through Diseases
for (var i=0; i<diseases.length; i++){
	var diseaseName = diseases[i].disease;
	
	// Retrieve Source + Destination Tables
	if (typeof diseases[i].clinical.patient === 'undefined') continue;
	
	var src = diseases[i].clinical.patient;

	// Read Source Table
	collection = yield comongo.db.collection(db, src);
	result = yield collection.find().toArray()
	
	
	result = result.filter(function(v){ return (v.days_to_death == null)	});
	var pts = result.map(function(elem){ return elem.patient_ID})
//	console.log(pts)

	// loop through clinical follow up tables
	for (var j=0; j<tables.length; j++){
		var src = diseases[i].clinical[tables[j]]
		if (typeof src === 'undefined') continue;

		// Read Source Table
		table = yield comongo.db.collection(db, src);
		fu = yield table.find({patient_ID: {$in: pts}}).toArray()
		dead = fu.filter(function(v){
			return (v.days_to_death !=null & v.status_vital =="DEAD" )
		});
		alive = fu.filter(function(v){
			return (v.days_to_last_follow_up !=null & v.status_vital !="DEAD" )
		});
		//map patient IDs from result & fu

		//replace null days_to_death value with dead follow up data if exists
		dead.forEach(function(p){
			var days = p.days_to_death;
			var status = p.status_vital;
			console.log(p.patient_ID + ": " + days + ": " + status)

			collection.update({patient_ID : p.patient_ID}, {$set: {"days_to_death" : days, "status_vital" : status  }}, {writeConcern: {w: "majority", j: true,wtimeout: 5000 } });

		})
		//replace days_to_last_follow_up value with more recent update
		alive.forEach(function(p){
			var days = p.days_to_last_follow_up;
			console.log(p.patient_ID + ": " + days )

			collection.update({patient_ID : p.patient_ID}, {$max: {"days_to_last_follow_up" : days  }}, {writeConcern: {w: "majority", j: true,wtimeout: 5000 } });

		})
				
		
	}

}

yield comongo.db.close(db);
}).catch(onError);
