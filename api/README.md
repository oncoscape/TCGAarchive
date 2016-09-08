# TCGAarchive/api 

## Important notes:

- oncoscape_api_explorer-master
    * Basic Query/Choose Collection dropdown menu is not being updated realtime. 
    ```
  	var comongo = require('co-mongodb');
	var co = require('co');

	var onerror = function(e){
	  console.log(e);
	}

	var db, collection,db_collections,db_stats;
	var availableCollectionTags = [];
	
	co(function *() {
	  db = yield comongo.client.connect('mongodb://username:password@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');
	  collections = yield comongo.db.collections(db);
	  disease_tables = yield collection.find({},{"disease":true,"clinical":true}).toArray();
	  disease_tables.forEach(function(c){
	    var collection_name = c['s']['name'];
	    availableCollectionTags.push(collection_name);
	  });
	  
	  yield comongo.db.close(db);
	}).catch(onerror);
 ```
 
- slate 
    * There are two molecular collection annotation json files:
        * /source/cbio_mol_annotation.json
        * /source/ucsc_mol_annotation.json
    
  
 
