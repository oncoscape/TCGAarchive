const comongo = require('co-mongodb');
const co = require('co');
var onError = function(e){ console.log(e); }
const _ = require('underscore');

co(function *() {

var result,
collection, collections, 
fields, field;

// Connect To Database
// Connect To Database
var user = "oncoscape"
var pw= process.env.dev_oncoscape_pw
var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0"
var db = yield comongo.client.connect(host);

// Read Diseases From Database That Are Not In Beta
lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
//diseases = yield lookup.find({beta:false, disease: {$ne: "hg19"}}).toArray();
diseases = yield lookup.find({disease: {$ne: "hg19"}}).toArray();
//diseases = yield lookup.find({beta:false, disease: "brain"}).toArray();

var tables = ["new tumor" ,"new tumor follow up","other malignancy","follow up"]

// Loop Through Diseases
for (var i=0; i<diseases.length; i++){
	var diseaseName = diseases[i].disease;
	var out_name = diseaseName + "_dashboard"
	console.log(diseaseName)
		
	// Retrieve Source + Destination Tables
	if (typeof diseases[i].clinical.diagnosis === 'undefined') continue;
	console.log("creating patient dashboard")
	
	var src = diseases[i].clinical.diagnosis;

	// Read Source Table
	collection = yield comongo.db.collection(db, src);
	result = yield collection.find().toArray()
	
	out = yield comongo.db.collection(db, out_name);
	
	var out_collection = result.map(function(elem){ 
		
		return { patient_ID: elem.patient_ID,
				 gender: elem.gender, 
				 age_at_diagnosis: elem.age_at_diagnosis, 
				 race: elem.race, 
				 ethnicity: elem.ethnicity, 
				 status_vital: elem.status_vital, 
				 last_known_disease_status: elem.last_known_disease_status, 
				 days_to_last_follow_up: elem.days_to_last_follow_up, 
				 days_to_death: elem.days_to_death
				 }
	})
	
	result = result.filter(function(v){ return (v.days_to_death == null)	});
	var pts = result.map(function(elem){ return elem.patient_ID})

	
	// include sample_ID, in/out of mol tables

	// loop through clinical follow up tables
	for (var j=0; j<tables.length; j++){
		var src = diseases[i].clinical[tables[j]]
		if (typeof src === 'undefined') continue;

		// Read Source Table
		// for all pts with null death date in src table
		//  if ID found in follow up tables && 
		//     ? death date specified: update status & death date
		//     ow ? last follow up > in src: update days_to_last_follow_up
		//     ow - no action
		table = yield comongo.db.collection(db, src);
		fu = yield table.find({patient_ID: {$in: pts}}).toArray()
		dead = fu.filter(function(v){
			return (v.days_to_death !=null & v.status_vital =="DEAD" )
		});
		alive = fu.filter(function(v){
			return (v.days_to_last_follow_up !=null & v.status_vital !="DEAD" )
		});
		//map patient IDs from result & fu

		out_collection.forEach(function(p){
		  m= dead.filter(function(d){ return d.patient_ID == p.patient_ID})
		  if(m.length > 0){
//			console.log(m[0].patient_ID + ": " + m[0].days_to_death + " - " + m[0].status_vital)
			p.days_to_death = m[0].days_to_death; 
			p.status_vital=m[0].status_vital;
			}
		  m= alive.filter(function(d){ return d.patient_ID == p.patient_ID})
		  if(m.length > 0){
//			console.log(m[0].patient_ID + ": " + m[0].days_to_last_follow_up )
			p.days_to_last_follow_up = m[0].days_to_last_follow_up; 
			}
		})				
		
	}
	out.drop()
	out.insertMany(out_collection, {writeConcern: {w: "majority", j: true,wtimeout: 5000 }} )
	lookup.update({disease:diseaseName}, {$set:{"clinical.patient": out_name}}, {writeConcern: {w: "majority", j: true,wtimeout: 5000 }} )
	
}

yield comongo.db.close(db);
}).catch(onError);
