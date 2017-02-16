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
manifest = yield comongo.db.collection(db, "manifest");
//diseases = yield lookup.find({beta:false, disease: {$ne: "hg19"}}).toArray();
diseases = yield lookup.find({disease: {$ne: "hg19"}}).toArray();
//diseases = yield lookup.find({disease: "luad"}).toArray();

var tables = ["new tumor" ,"new tumor follow up","other malignancy","follow up"]


// Loop Through Diseases
for (var i=0; i<diseases.length; i++){
	var diseaseName = diseases[i].disease;
	var out_name = diseaseName + "_dashboard"
	var events_name = diseaseName + "_events"
	console.log(diseaseName)
		
	// Retrieve Source + Destination Tables
	if (typeof diseases[i].clinical.diagnosis === 'undefined') continue;
	console.log("creating patient dashboard")
	
	var src = diseases[i].clinical.diagnosis;

	// Read Source Table
	collection = yield comongo.db.collection(db, src);
	result = yield collection.find().toArray()

	out = yield comongo.db.collection(db, out_name);
	events_co = yield comongo.db.collection(db, events_name)
	events = yield events_co.find().toArray()
	
	if(typeof events[0] !== "undefined"){
	
		// some keys have periods in the name -- need to be removed for valid JSON
		var events_pts = Object.keys(events[0])
		console.log(events_pts.length)
		for(var pe=1;pe<events_pts.length;pe++){  // for each patient
//			console.log(events_pts[pe])
			for(var ev=0;ev< events[0][events_pts[pe]].length;ev++){ //for each event 
				var dataKeys = Object.keys(events[0][events_pts[pe]][ev].data).filter(function(k){return k.match(/\./g)})
	//			console.log(dataKeys)
				for(var k=0;k<dataKeys.length;k++){  // for each key in the data field
					var key = dataKeys[k].replace(/\./g, " ")
	//				console.log(dataKeys[k]+ " " + key)
					events[0][events_pts[pe]][ev].data[key] = events[0][events_pts[pe]][ev].data[dataKeys[k]]
					delete events[0][events_pts[pe]][ev].data[dataKeys[k]];
				}
	//			console.log(Object.keys(events[0][events_pts[pe]][ev].data))
			}
		}
//		events_co2 = yield comongo.db.collection(db, events_name+"fu")
//		var fu = events_co2.insert(events )
//		console.log(fu)
	}
	
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

	function getFormattedDate(date) {
	  var year = date.getFullYear();
	  var month = (1 + date.getMonth()).toString();
	  month = month.length > 1 ? month : '0' + month;
	  var day = date.getDate().toString();
	  day = day.length > 1 ? day : '0' + day;
	  return month + '/' + day + '/' + year;
	}
	_.mixin({
	  camelcase: function(string) {
			return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
		}
	});
	
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
		
		  m= alive.filter(function(d){ return d.patient_ID == p.patient_ID})
		  for(var z=0;z<m.length;z++){
//			console.log(m[0].patient_ID + ": " + m[0].days_to_last_follow_up )
			if(p.days_to_last_follow_up < m[z].days_to_last_follow_up)
				p.days_to_last_follow_up = m[z].days_to_last_follow_up; 
			}
		  m= dead.filter(function(d){ return d.patient_ID == p.patient_ID})
		  for(var z=0;z<m.length;z++){
//			console.log(m[0].patient_ID + ": " + m[0].days_to_death + " - " + m[0].status_vital)
			if(p.days_to_death < m[z].days_to_death){
			p.days_to_death = m[z].days_to_death; 
			p.status_vital=m[z].status_vital;
			}
		   }
		})		
		
		if(typeof events[0] === "undefined") continue;
		
		alive.forEach(function(d){
//			console.log(d.patient_ID)
			
			if(typeof events[0][d.patient_ID] === "undefined") return;
			var event_diagnosis = _.findWhere(events[0][d.patient_ID], { name: "Diagnosis" })
			if(typeof event_diagnosis === "undefined") return;
			
			var idx_dx = _.indexOf(events[0][d.patient_ID], event_diagnosis)
			var dx_date = new Date(events[0][d.patient_ID][idx_dx].start)
//			console.log("DxDate: "+getFormattedDate(dx_date))
						
			var event_status = _.findWhere(events[0][d.patient_ID], { name: "Status" })
			if(typeof event_status === "undefined") return;
			var idx_status = _.indexOf(events[0][d.patient_ID], event_status)
			var orig_status_date = new Date(event_status.start)
//			console.log("Status Date: " + event_status.start + " " + event_status.data.status)
			
			var status_date = new Date(dx_date)

			status_date.setDate(status_date.getDate() + d.days_to_last_follow_up)
//			console.log("Alive: " + getFormattedDate(status_date))
			
			if(status_date > orig_status_date){
//			console.log("Update Alive: " + getFormattedDate(status_date))
				events[0][d.patient_ID][idx_status].data.status = _.camelcase(d.status_vital)
				events[0][d.patient_ID][idx_status].start = 
				events[0][d.patient_ID][idx_status].end = getFormattedDate(status_date)
			}
		})
		dead.forEach(function(d){
		
//			console.log(d.patient_ID)
			var event_diagnosis = _.findWhere(events[0][d.patient_ID], { name: "Diagnosis" })
			if(typeof event_diagnosis === "undefined") return;
			var idx_dx = _.indexOf(events[0][d.patient_ID], event_diagnosis)
			var dx_date = new Date(events[0][d.patient_ID][idx_dx].start)
//			console.log("DxDate: "+getFormattedDate(dx_date))
						
			var event_status = _.findWhere(events[0][d.patient_ID], { name: "Status" })
			if(typeof event_status === "undefined") return;
			var idx_status = _.indexOf(events[0][d.patient_ID], event_status)
//			console.log("Status Date: " + event_status.start + " " + event_status.data.status)
			
			var death_date = new Date(dx_date)
			death_date.setDate(death_date.getDate() + d.days_to_death)
//			console.log("Update Death: " + getFormattedDate(death_date))
			
			events[0][d.patient_ID][idx_status].data.status = _.camelcase(d.status_vital)
			events[0][d.patient_ID][idx_status].start = 
			events[0][d.patient_ID][idx_status].end = getFormattedDate(death_date)

		})
		
	}

updateMongo = true
if(updateMongo){	
	if(typeof events[0] !== "undefined"){
		events_co.drop();
//		for(var k=0;k<events
		events_co.insertMany(events, {writeConcern: {w: "majority", j: true,wtimeout: 5000 }} )
	}
	
	out.drop()
	if(out_collection.length < 1000){
		out.insertMany(out_collection, {writeConcern: {w: "majority", j: true,wtimeout: 5000 }} )
	} else{
		for(var j=0;j<out_collection.length; j++){
			out.insert(out_collection[j], {writeConcern: {w: "majority", j: true,wtimeout: 5000 }} )
		}
	}
//	lookup.update({disease:diseaseName}, {$set:{"clinical.patient": out_name}}, {writeConcern: {w: "majority", j: true,wtimeout: 5000 }} )
	oCollection = manifest.find({dataset:diseaseName, dataType: "diagnosis"})
	manifest.insert({dataset:diseaseName, 
					 dataType: "patient", 
					 source:oCollection.source, 
					 process:"clinical.updates dashboard", 
					 parent: oCollection._id,
					 collection: out_name}, {writeConcern: {w: "majority", j: true,wtimeout: 5000 }})
}
}

yield comongo.db.close(db);
}).catch(onError);
