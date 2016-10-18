switch(t){
				    case "color":
				    	{
				    		// var cursor = collection.find();
				    		// var elem = {};
				    		// elem = a;
				    		// elem.ptIDStatus = [];
				    		console.log('within color');
				    		cursor.each(function(err, item){
					          if(item != null){
					            item.data.forEach(function(e){
					            	elem.ptIDStatus.push(e.values.arraysCompare(ptIDs));
					            });
					          }
					        });
					        status.push(elem);
				    	}
				    case "mut" :
				    case "mut01":
				    case "methylation":
				    case "rna":
				    case "protein":
				    case "cnv":
				    	{
				    		var collection = db.collection(a.collection);
				    		var cursor = collection.find();
				    		var elem = {};
				    		elem.collection = a.collection;
				    		elem.type = a.type;
				    		elem.details = [];
				    		console.log('within color');
				    		cursor.each(function(err, item){
					          if(item != null){
					          	elem.details.push(Object.keys(item.patients).arraysCompare(ptIDs));
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
				    	{
				    		console.log("within clinical");
				    		var collection = db.collection(a.collection);
				    		var res;
				    		elem.collection = a.collection;
				    		elem.type = a.type;
				    		elem.details = {};
				    		collection.find({},{'patient_ID':true}).toArray().then(function(r){
				    			//console.log("within toArray");
				    			var ids = r.map(function(r){return r['patient_ID']});
				    			//console.log(ids);
				    			elem.details = ids.arraysCompare(ptIDs);
				    			status.push(elem);
				    		});
				    	}
				    case "pcaScores":
				    case "mds":
				    	{	
				    		var collection = db.collection(a.collection);
				    		var cursor = collection.find();
				    		var elem = {};
				    		elem.collection = a.collection;
				    		elem.type = a.type;
				    		elem.details = [];
				    		console.log('within pcaScores or mds');
				    		cursor.each(function(err, item){
					          if(item != null){
					          	elem.details.push(Object.keys(item.data).arraysCompare(ptIDs));
					          }
					        });
					        status.push(elem);
				    	}
				    case "edges":
				    	{
				    		console.log("within edges");
				    		// var collection = db.collection(a.collection);
				    		var res;
				    		elem.collection = a.collection;
				    		elem.type = a.type;
				    		elem.details = {};
				    		collection.find({},{'p':true}).toArray().then(function(r){
				    			//console.log("within toArray");
				    			var ids = r.map(function(r){return r['p']});
				    			//console.log(ids);
				    			elem.details = ids.arraysCompare(ptIDs);
				    			status.push(elem);
				    		});
				    	}
				    case "ptDegree":
				    	{
				    		console.log("within ptDegree");
				    		var keys = [];
				    		elem.collection = a.collection;
				    		elem.type = a.type;
				    		elem.details = {};
				    		cursor.each(function(err, item){
					          if(item != null){
					          	keys.push(Object.keys(items));
					          }
					        });
					        keys = keys.unique();
					        elem.details = keys.arraysCompare(ptIDs.push('_id'));
					        status.push(elem);
				    	}
				};
