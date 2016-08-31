const connectionString = 'mongodb://localhost:27017/oncoscape';
const dataDir = "../data";
const comongo = require('co-mongodb')
var co = require('co');
const _ = require('underscore');
const assert = require('assert');
const fs = require('fs');
const rl = require('readline');
const request = require('sync-request');
const xml = require('xmldom');
const execSync = require('child_process').execSync;
var collection, data, i, j;

// // Read Files
var metaNames = fs.readdirSync(dataDir).filter(function(d){ return d.indexOf(".json")!=-1; }).filter(function(d){ return d.indexOf("metadata")!=-1; });
var fileNames = fs.readdirSync(dataDir).filter(function(d){ return d.indexOf(".json")!=-1; }).filter(function(d){ return d.indexOf("metadata")==-1; });
var tableNames = fileNames.map(function (f){ return f.replace(".json","").replace(".","-").trim().replace("TCGA","TCGA_").toLowerCase() });
var dataSources = tableNames.map(function(f){ 
	var parts = f.split("_");
	return {
		"source": parts[1],
		"disease": parts[0],
		"table": parts[2],
		"collection": f
	}
});

var onerror = function(e){
	console.log("SHIT!");
	console.log(e);
}

co(function *() {
	
	// db is just a regular Db instance from the native driver. 
	db = yield comongo.client.connect(connectionString);


	

	/* Insert Patient Locations Scaled
	var patientFiles = fs.readdirSync(dataDir+"/molecular/mds/scaled/")
		.filter(function(d){ return d.indexOf(".json")!=-1; })
		.filter(function(d){ return d.indexOf("_scaled")==-1 })
		.map(function(d){ return d.replace(".json","").replace("mds","") })
		.map(function(d){

			var d1 = JSON.parse(fs.readFileSync(dataDir+"/molecular/mds/scaled/mds"+d+"_scaled.json"));
			var d2 = JSON.parse(fs.readFileSync(dataDir+"/molecular/mds/scaled/mds"+d+".json"));

			var data = [];
 			Object.keys(d2).forEach(function(key){
 				data.push({name:key});
 			},{data:data});
 			for (var i=0; i<data.length; i++){
 				data[i].position = {x:Math.round(d1[i][0]),y:Math.round(d1[i][1])};
 			}
 			return {collection:d, data:data};
		});
	for (var i=0; i<patientFiles.length; i++){
		collection = yield comongo.db.collection(db, "_mp_pt"+patientFiles[i].collection);
		yield collection.insertMany(patientFiles[i].data, {w:"majority"});
	}
	*/
	

	/* Insert Gene Locations Scaled 
	collection = yield comongo.db.collection(db, "_mp_genes");
	data = fs.readFileSync(dataDir+"/molecular/hg19/gene_symbol_min_abs_start_hg19_scaled.json");
    data = JSON.parse(data);
    data = Object.keys(data).map(function(key){
    	return {name:key, position:{x:data[key][0], y:data[key][1]}}
    },{data,data});
    yield collection.insertMany(data, {w:"majority"});
    */


    /* Insert Gene Collections ---------------------------------------
    var genes = JSON.parse(fs.readFileSync(dataDir+"/molecular/hg19/gene_symbol_min_abs_start_hg19_scaled.json"));
    var genesets = JSON.parse(fs.readFileSync(dataDir+"/molecular/hg19/genesets_by_symbol.json"));
    var data = Object.keys(genesets).map(function(geneset){
    	return {
    		name: geneset,
    		genes: genesets[geneset].map(function(gene){
    			if (genes[gene]){
    				return {
	    				name:gene,
	    				position: {x:Math.round(genes[gene][0]), y:Math.round(genes[gene][1])}
	    			};
    			}
	    		return {
	    			name:gene,
	    			position: {x:0,y:0}
	    		};
	    	}, {genes:genes})
    	};
    }, {genesets:genesets, genes:genes})
	collection = yield comongo.db.collection(db, "_mp_genesets");
	yield collection.insertMany(data, {w:"majority"});
	*/

 

    /* Insert All MP Edges Json Files In DataDir --------------------------------------- */
    /*
	var molecFiles = fs.readdirSync(dataDir+"/molecular/edges/").filter(function(d){ return d.indexOf(".json")!=-1; });
	for (var f=0; f<molecFiles.length; f++){
 		var data = JSON.parse(fs.readFileSync(dataDir+"/molecular/edges/"+molecFiles[f]));
 		var collectionName = "_mp_"+molecFiles[f].replace(".json","").replace(/\./g,"-");
 		var data = data.map(function(datum){
			return {"m":datum[0], "g":datum[1], "p":datum[2]};
		});
 		collection = yield comongo.db.collection(db, collectionName);
		yield collection.insertMany(data, {w:"majority"});
		console.log(collectionName);
 	}
 	*/
		
	// Insert All Clinical Json Files In DataDir --------------------------------------- 
    var clinicalFiles = fs.readdirSync(dataDir+"/clinical/").filter(function(d){ return d.indexOf(".json")!=-1; }).filter(function(d){ return d.indexOf("metadata")==-1; })
	for (i=0; i<clinicalFiles.length; i++){
    	data = fs.readFileSync(dataDir+"/clinical/"+fileNames[i]).toString().replace(/("\w+)(\.)(\w+":)/g, "$1$3")
    	data = JSON.parse(data);
    	collection = yield comongo.db.collection(db, tableNames[i]);
    	yield collection.insertMany(data, {w:"majority"});
    	console.log("INSERT TABLE: "+tableNames[i]);
    }
    
	
    /* Insert All Molec Json Files In DataDir --------------------------------------- 
    var molecFiles = fs.readdirSync(dataDir+"/molecular/").filter(function(d){ return d.indexOf(".json")!=-1; }).filter(function(d){ return d.indexOf("metadata")==-1; })
	for (var f=0; f<molecFiles.length; f++){
		console.log("INSERT FILE: "+molecFiles[f]);
     	var d = fs.readFileSync(dataDir+"/molecular/"+molecFiles[f]).toString().replace(/("\w+)(\.)(\w+":)/g, "$1$3")
     	d = JSON.parse(d)[0];
     	for (var i=0; i<d.rows.length; i++){
     		console.log(d.rows[i])
     		var cname = d.source.replace(/_/g,"")+"_"+d.disease.replace(/_/g,"")+"_"+d.dataType.replace(/_/g,"")+"_"+d.process.replace(/_/g,"");
     		collection = yield comongo.db.collection(db, cname);
     		var o = {gene:(d.rows[i]!=null) ? d.rows[i].split("|")[0] : null, data:d.data[i]};
     		yield collection.insert(o, {w:"majority"});	
     	}
     }
     */
     
    /* Pull Field Meta Data From Online ---------------------------------------
	collection = yield comongo.db.collection(db, "_field");
	cde_ids = yield collection.distinct("cde_ids");
	cde_ids = cde_ids
		.filter((v) => (v.length>0))
		.map(function(val){ return parseInt(val); })
    	.sort(function(a, b){return a-b})
    	.map(function(val){ return {
    			cdeid:val, 
    			xml:"http://cadsrapi.nci.nih.gov/cadsrapi41/GetXML?query=DataElement[@publicId="+val+"]",
    			url:"https://cdebrowser.nci.nih.gov/CDEBrowser/search?elementDetails=9&publicId="+val+"&version=1.0"
    		}; 
    	});
    cde_ids.forEach(function(obj){
    	var res = request('GET', obj.xml);
    	var xmlDoc = new xml.DOMParser().parseFromString(res.getBody().toString('utf-8'));
    	var elements = xmlDoc.getElementsByTagName("field");
		for (var i=0; i<elements.length; i++){
			var element = elements[i];
			if (element.hasAttribute("name")){
				if (element.getAttribute("name")=="longName")
					obj.name = element.childNodes[0].nodeValue;
				if (element.getAttribute("name")=="preferredDefinition")
					obj.desc = element.childNodes[0].nodeValue;
			}
		}
		console.log("FETCHED : "+obj.name);
    });
    collection = yield comongo.db.collection(db, "_cde");
    yield collection.insertMany(cde_ids, {w:"majority"});
    */

    /* Build Collection Tree ---------------------------------------
    dataSources = dataSources.filter((f)=> f.collection.charAt(0)!="_");
    for (var i=0; i<dataSources.length; i++){
    	collection = yield comongo.db.collection(db, dataSources[i].collection);
    	dataSources[i].records = yield collection.count();
    	dataSources[i].created = new Date();
    }
    dataTree = _.chain(dataSources).pluck("source").uniq().map(function(v){return { name:v,
        diseases:_.chain(dataSources).where({source:v}).pluck("disease").uniq().map(function(v){ 
            return { name:v,
                tables: _.chain(dataSources).where({source:"tcga",disease:v}).map(function(v){ 
                    return {created:v.created, name:v.table, records:v.records, collection:v.collection}} ).value()
            };}).value()
    };}).value();
    collection = yield comongo.db.collection(db, "_collections");
    yield collection.insert(dataTree, {w:"majority"});
    */

    /* Column Enums 
	data = fs.readFileSync(dataDir+"/_column_enum.json")
	data = JSON.parse(data);
	var values = [];
	Object.keys(data).forEach(function(key){
		this.values.push({
				type:key.replace("os.class.",""),
				name:key.replace("os.class.","").replace("."," ").replace("_"," "),
				mappings:this.data[key]
		});
	}, {data:data, values:values});
 	collection = yield comongo.db.collection(db, "_column_mapping");
 	yield collection.insertMany(values, {w:"majority"});
 	*/

 	/* Field Enums 
	data = fs.readFileSync(dataDir+"/_field_enum.json")
	data = JSON.parse(data);
	var values = [];
	Object.keys(data).forEach(function(key){
		var mappings =  this.data[key];
		var mapping = [];
		Object.keys(mappings).forEach(function(map){
			this.mapping.push({
				type:map,
				name:map.replace("os.class.","").replace("."," ").replace("_"," "),
				values:this.mappings[map]
			});
		}, {mappings:mappings, mapping:mapping});
		this.values.push({
				type:key.replace("os.class.",""),
				name:key.replace("os.class.","").replace("."," ").replace("_"," "),
				mappings:mapping
		});
	}, {data:data, values:values});
	
 	collection = yield comongo.db.collection(db, "_field_mapping");
 	yield collection.insertMany(values, {w:"majority"});
 	*/


    /* Calculate All Metadata ---------------------------------------  */
    /*
    dataSources = dataSources.filter((f)=> f.collection.charAt(0)!="_");
  	for (var i=0; i<dataSources.length; i++){
		var tableName = dataSources[i].collection;

		// Run External Comand To Generate Base Meta Data Files + Read Into Memory + Reformat
		execSync('mongo oncoscape --eval "var collection = \''+tableName+'\', outputFormat=\'json\'" --quiet ./meta/variety.js > ./metadata/'+tableName+'.json');
		data = JSON.parse(fs.readFileSync('./tmp/'+tableName+'.json'));
		data = data.map((v)=>{ 
			return {
				key:v._id.key, 
				count:v.totalOccurrences, 
				percent: Math.round(v.percentContaining * 1000) / 1000,
				type: Object.keys(v.value.types)[0]}
			});
		for (var ii=0; ii<data.length; ii++){

			var field = data[ii];
     		var result = yield comongo.db.collection(db, tableName);
			result = yield result.distinct(field.key);
			field.distinct = result.length;

			collection = yield comongo.db.collection(db, "_field");
			var fv = yield collection.find({columns:field.key, disease:"TCGA"+tableName.split("_")[1] }).toArray();
			if (fv.length>0){

				field.cdeid = parseInt(fv[0].cde_ids);
				collection = yield comongo.db.collection(db, "_cde");
				var _cde = yield collection.find({cdeid:field.cdeid}).toArray();
				if (_cde.length>0){
					field.name = _cde[0].name;
					field.xml = _cde[0].xml;
					field.url = _cde[0].url;
					field.desc = _cde[0].desc;
				}

				collection = yield comongo.db.collection(db, "_field");
				var _field = yield collection.find({cde_ids:field.cdeid.toString()}).toArray();

				if (_field.length>0){
					field.tcga = _field[0].tcga_columns;
					field.oncoscape = _field[0].columns;
				}

				collection = yield comongo.db.collection(db, "_field_mapping");
				var _mapping = yield collection.find({$or:[{type:field.oncoscape}, {type:field.tcga}]}).toArray();
				if (_mapping.length>0){
					field.mappings = _mapping[0].mappings;
					console.log("FOUND mapPING");
				}

			}
			switch(field.type){
				case "Boolean":
		  	  		var result = yield comongo.db.eval(db, 'fnGetFactorCount("'+tableName+'", "'+field.key+'")');
  	  				field.values = result.map((v)=>{ return {"label":(v._id==null)?"NA":v._id.toString(),"value":v.count}});
  	  				break;
  	  			case "String":
  	  				if (field.distinct<=30){
  	  					var result = yield comongo.db.eval(db, 'fnGetFactorCount("'+tableName+'", "'+field.key+'")');
  	  					field.values = result.map((v)=>{ return {"label":(v._id==null)?"NA":v._id.toString(),"value":v.count}});
  	  				}
  	  				break;
  	  			case "Number":
  	  				var coll = yield comongo.db.collection(db, tableName);
  	  				var result = yield coll.aggregate([{
			            $group: {
			            	_id: "$item",
			                minQuantity: {
			                    $min: "$" + field.key
			                },
			                maxQuantity: {
			                    $max: "$" + field.key
			                }
			            }
			        }]).toArray();
        			result = yield coll.mapReduce(
        				function() {
		            		var x = Math.round(this[field] / bin) * bin;
		            		var key = x + "/" + (x + bin);
		            		emit(key, { sum: this[field], count: 1 })
			    		},
			    		function(state, values) {
		            		var result = { sum: 0, count: 0 };
		            		values.forEach(function(value) {
		                		result.sum += value.sum;
		                		result.count += value.count;
		            		});
		            		return result;
		        		},{
		        			finalize: function(key, reducedValue) {
		            			var minmax = key.split("/");
		            			var rv = {
		                			min: parseInt(minmax[0]),
		                			max: parseInt(minmax[1]),
		                			avg: Math.round(reducedValue.sum / reducedValue.count),
		                			cnt: reducedValue.count
		            			}
		            			if (isNaN(rv.min)) rv.min = null;
		            			if (isNaN(rv.max)) rv.max = null;
		            			if (isNaN(rv.avg)) rv.avg = null;
		            			if (isNaN(rv.cnt)) rv.cnt = null;
								return rv;
			        		},
			        		out: {
					            inline: "query"
					        },
					        scope: {
					            bin: Math.floor((result[0].maxQuantity-result[0].minQuantity)/30),
					            collection: tableName,
					            field: field.key
					        }
		    			});
        				field.values = result.map(
        				 	(v)=>{ return {"label":(v._id==null)?"NA":v._id.toString(),"value":v.value.cnt,"avg":v.value.avg} });
  	  				break;
			}
		}

		var obj = {collection:tableName, fields:data};
		var coll = yield comongo.db.collection(db, "_field_detail");
		yield coll.insert(obj, {w:1});
	}
	*/

  
	yield comongo.db.close(db);
}).catch(onerror);