      if(t == "color"){
          console.log('within color');
          cursor.each(function(err, item){
            if(item != null){
              item.data.forEach(function(e){
              	elem.ptIDs = elem.ptIDs.concat(e.values).unique();
                // var evaluation = e.values.arraysCompare(ptList[d.disease]);
                // console.log(evaluation);
                // if(evaluation.itemsNotInRef.length != 0){
                //   elem.ptIDs = elem.ptIDs.concat(evaluation.itemsNotInRef).unique();
                // }
              });
            }else{
              next();
            }
          });
        }
        else if(t == "events"){
          console.log("within events");
          cursor.each(function(err, item){
            if(item != null){
              elem.ptIDs = elem.ptIDs.concat(Object.keys(item)).unique();
              // var evaluation = Object.keys(item).arraysCompare(ptList[d.disease]);
              // if(evaluation.itemsNotInRef.length != 0){
              //   elem.ptIDs = elem.ptIDs.concat(evaluation.itemsNotInRef).unique();
              // }
            }else{
              next();
            }
          });
        }
        else 

	        
	        else if(t == "color"){
	          console.log('within color');
	          cursor.each(function(err, item){
	            if(item != null){
	              item.data.forEach(function(e){
	                elem.pList = elem.pList.concat(e.values).unique();
	              });
	            }else{
	            	return elem;
	            }
	          });
	        }else if(t == "events"){
	          console.log("within events");
	          cursor.each(function(err, item){
	            if(item != null){
	              elem.pList = elem.pList.concat(Object.keys(item)).unique();
	            }else{
	            	return elem;
	            }
	          });
	        }else if(["patient", "drug", "newTumor", "otherMalignancy", "radiation", "followUp", "newTumor-followUp"].indexOf(t) > -1){
	          console.log("within clinical");
	          console.log(count++);
	          collection.distinct('patient_ID').then(function(ids){
	            elem.pList = elem.pList.concat(ids).unique();
	            //next();
	            return elem;
	          });
	        }else if(["pcaScores", "mds"].indexOf(t) > -1){
	          console.log("within pcaScores or mds");
	          cursor.each(function(err, item){
	            console.log(count++);
	            if(item != null){
	              elem.pList = elem.pList.concat(Object.keys(item.data)).unique();
	            }else{
	            	return elem;
	            }
	          }); 
	        }else if(t == "edges"){
	          console.log("within edges");
	          collection.distinct('p').then(function(ids){
	            elem.pList = elem.pList.concat(ids).unique();
	            return elem;
	          }); 
	        }else if(t == "ptDegree"){
	          console.log("within ptDegree");
	          cursor.each(function(err, item){
	            console.log(count++);
	            if(item != null){
	              elem.pList = elem.pList.push(Object.keys(item)[1]).unique();
	            }else{
	            	return elem;
	            }
	          });