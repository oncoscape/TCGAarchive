const comongo = require('co-mongodb');
const co = require('co');
var onError = function(e){ console.log(e); }

co(function *() {

var result,
collection, collections, 
fields, field;

// Connect To Database
var user = "oncoscape"
var pw= process.env.dev_oncoscape_pw
var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0"
var db = yield comongo.client.connect(host);

// Read Diseases From Database That Are Not In Beta
collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
//diseases = yield collection.find({beta:false, disease: {$ne: "hg19"}}).toArray();
//diseases = yield collection.find({beta:false, disease: {$in: ["brain", "luad", "lusc", "brca", "hnsc", "prad", "gbm", "lgg"]}}).toArray();
diseases = yield collection.find({disease: "lusc"}).toArray();
//diseases = yield collection.find({disease: {$in: ["chol", "dlbc"]}}).toArray();
//diseases = yield collection.find({disease: {$nin: ["hg19", "meso", "lung", "pancan", "pancan12", "coadread"]}}).toArray();

// Loop Through Diseases
for (var i=0; i<diseases.length; i++){
	var diseaseName = diseases[i].disease;
	console.log(diseaseName)
	
	// Read Source Table
	var sample_coll = diseases[i].clinical.samplemap;
	sampleCollection = yield comongo.db.collection(db, sample_coll);
	sampleMap =  yield sampleCollection.find().toArray();
	console.log("-- sample map read")
	
//	console.log(diseases[i].category)
	// Add Cateogry If Absent
	if (!diseases[i].hasOwnProperty("category") || !diseases[i].category || diseases[i].category ===null ){
		diseases[i].category = [ { source: 'tcga',
			type: 'color',
			collection: diseases[i].disease+'_color' } ];
			yield collection.save(diseases[i]);
	}

	// Retrieve Source + Destination Tables
	if (typeof diseases[i].clinical.diagnosis === 'undefined') continue;
	
	var src = diseases[i].clinical.diagnosis;
	var dst = diseases[i].category
	.filter(function(v){
	return (v.type=="color" && v.source=="tcga")
	})[0].collection;
//console.log("--",dst,"setup" )


	// Read Source Table
	collection = yield comongo.db.collection(db, src);
	result = yield collection.find().toArray();
//console.log("-- diagnosis collection read ")

	// Establish Color Palette
	var colors = ['#2e63cf','#df3700','#ff9a00','#009700','#9b009b','#0099c9','#df4176','#64ac00','#ba2c28','#2e6297'];
	var colorgrade = ["#F3E5F5","#E1BEE7","#CE93D8","#BA68C8","#AB47BC","#9C27B0","#8E24AA","#7B1FA2","#6A1B9A"];

	// Retrieve Fields To Process (strip patient ids)
	fields = result.map(function(elem){return Object.keys(elem);}).reduce(function(p,c){
		keys = c.filter(function(f){
		if (f =="_id") return false;
		if (f =="patient_ID") return false;
		if (p.indexOf(f) != -1) return false;
		return true;
		})

		return p.concat(keys);
	}, []);
//	console.log(fields);

	// Set Collection To Dest
	collection = yield comongo.db.collection(db, dst);
//	collection.remove({subtype: {$exists : true}})
//!!	collection.remove({subtype: {$ne : "Core"}})


	// Loop Through Each Field
	for (var fieldIndex=0; fieldIndex<fields.length; fieldIndex++){

		// Count Distinct Field Values (Factors Only @ This Point)
		var field = fields[fieldIndex];
//		console.log("---",field)
		var factors = result.reduce(function(p,c){
			var f = p.field;
			var o = p.out;
			var v = c[f];
			if( typeof v === 'undefined') v = 'null';
			if (!o.hasOwnProperty(v)) o[v] = [];
			var samples = Object.keys(sampleMap[0]).filter(function(s){ return sampleMap[0][s] == c["patient_ID"] ;})
//		console.log(samples)
			o[v] = o[v].concat(samples)

			var r = c.study
			if (v != 'null' & typeof r !== 'undefined' & p.study.indexOf(r) === -1) p.study.push(r)

			return p;
		}, {field:field, out:{}, study:[]});

		// Omit Fields With More Than 10 Values
		var factorCount = Object.keys(factors.out).length;
		if (factorCount>10 || factorCount<2 ) continue;

		var getPercentNil = function(f){
			var nils = Object.keys(f.out).reduce(function(prev,curr){
			if (curr=='null') prev.nil += prev.factors[curr].length;
			else prev.defined += prev.factors[curr].length;
			return prev;
			},{'nil':0,'defined':0, 'factors':f.out });
			return (1-(nils.nil / (nils.nil+nils.defined))).toPrecision(2);
		}

		factors.percent = getPercentNil(factors);
//		if (factors.percent<=.3) continue;
		
		subtype = "Clinical";
		if(factors.study.length > 0) subtype = factors.study.join(" + ").toUpperCase()

		var colorOption = {
			dataset: diseaseName,
			type: "color",
			subtype: subtype,
			name: field.replace(/_/gi," ").toLowerCase().replace(/(\b[a-z](?!\s))/g, function(x){return x.toUpperCase();}) + " ("+parseInt(factors.percent*100).toString()+"%)",
			percent: factors.percent,
			data: []
		};

		var colCode = colors;

		var keys = Object.keys(factors.out)
				.sort(function(a,b){
					if (a=='null') return 1;
					if (b=='null') return -1;
					return 0;
				})

		var colors = (function(k){
			// Strip Null
			var k = k.filter(function(v){return (v.toLowerCase().trim()!="null");})			

			// Is Numeric?
			if (k.reduce(function(p,c){ if (isNaN(c)) p = false; return p; }, true)) 
			return ["#F3E5F5","#E1BEE7","#CE93D8","#BA68C8","#AB47BC","#9C27B0","#8E24AA","#7B1FA2","#6A1B9A"];

			// T/F
			if (k.reduce(function(p,c){ c = c.toLowerCase().trim(); if(c!='true' & c!='false') p=false; return p; }, true))
			return ["#9C27B0","#FF9800"];

			return ["#E91E63", "#673AB7","#2196F3","#00BCD4","#4CAF50","#CDDC39","#FFC107","#FF5722","#795548", "#607D8B"];

		})(keys);
		
		for (var z=0; z<keys.length; z++){
			colorOption.data.push({
				"name": keys[z].replace(/_/gi," ").toLowerCase().replace(/(\b[a-z](?!\s))/g, function(x){return x.toUpperCase();}),
				"color": colors[z],
				"values": factors.out[keys[z]]
			})
		}
		colorOption.data = colorOption.data.sort(function(a,b){
			var aname = (parseInt(a.name)!=NaN) ? parseInt(a.name) : a.name;
			var bname = (parseInt(b.name)!=NaN) ? parseInt(b.name) : b.name;
			if (aname < bname) return -1;
			if (aname > bname) return 1;
			return 0;
		}).sort(function(a,b){
			if (a.name=='Null') return 1;
			if (b.name=='Null') return -1;
			return 0;
		});

//!!		yield collection.insert(colorOption, {w:"majority"});

		console.log("---"+colorOption.dataset +":"+ colorOption.name+":"+colorOption.percent)
//		console.log(keys)
		console.log(colorOption.data.map(function(v){return v.name}));
		//console.log(factors.percent);
		//console.log(dst);
	}
}
yield comongo.db.close(db);
}).catch(onError);
