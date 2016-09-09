# TCGAarchive/api 

## Important notes:

- oncoscape_api_explorer-master
	
	* To install:

		* cd to the dir: 

		```
		
		bower update
		sudo npm update
		
		```

	* To develop: 

		cd dir
		
		```
		
		gulp serve
		cd app
		
		```
		
		Modify scripts/main.js, style/main.css, or index.html


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

  	* To develop

  	  cd to root and turn on the server by
  	  
  	  ```
  	  
  	  bundle exec middleman serve
  	  
  	  ```
  	  
  	  open another terminal
  	  
  	  ```

  	  cd source

	  ```
	  
	  index.html.md has a section "includes" to specify the markdown files within includes folder.

	  Currently, index.html.md only includes includes/clinic_api_query_1.md, which is generated from running clinic.js with node. 

	  ```

	  cd source/
	  $node clinic.js > includes/_clinic_api_query_1.md

	  ```


 	* To publish
 	  
 	  cd to root

 	  ```

 	  ./deploy.sh

 	  ```

 	 You can host the build/ folder on your own server. 
 	 