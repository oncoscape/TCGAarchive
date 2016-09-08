var diseases, schemas;
(function () {
  'use strict';	
   var ajv = new Ajv();
   
   var getAllIndexes = function(arr, val) {
	    var indexes = [], i = -1;
	    while ((i = arr.indexOf(val, i+1)) != -1){
	        indexes.push(i);
	    }
	    return indexes;
	}
   var service = function(url, fun){
		
		$.ajax({
        	url: url
	    }).error(function (err) {
	    	alert(this.name + " ERROR");
	    	throw err;
	    }).done(function (result) {
	        fun(result);
	    });		   
	};	

   
   var updateDiseases = function(data){
   	   console.log(data);
   	   diseases = data;
   }

   var updateSchemas = function(data){
   	   console.log(data);
   	   schemas = data;
   }

   /* update diseases and schemas 
   */

  var updateValues = (function(){
   	  var diseaseURL = "http://localhost:3000/api/_diseases_tables_mapping";
   	  service(diseaseURL, updateDiseases);
   	  var schemasURL = "http://localhost:3000/api/_tools_schemas";
   	  service(schemasURL, updateSchemas);
   })();
  
  

  describe('Give it some context', function () {
    describe('check one patient table', function () {
		var ptSchema = {
				"properties":{
				   "patient_ID": {"type": "string"},
					"days_to_birth": {"type": "integer"},
					"diagnosis_year": {"type": "integer"},
					"history_lgg_dx_of_brain_tissue":{"type":"boolean"}
				},
				"required": ["patient_ID","days_to_birth","diagnosis_year"],
				"additionalProperties": true	
			};
		var promise;
				
   //      beforeEach(function(){
   //      	var url = "http://localhost:3000/api/tcga_blca_pt";   
			// promise	= new Promise(function(resolve, ))jQuery.get(url, function(data) {
			// 				doc = data;	
			// 			});
   //      })
		it("fails with assertion error", function (done) {
		    setTimeout(function () {
		        try {
		            assert.equal(1, 2);
		            done();
		        }
		        catch (e) {
		            done(e);
		        }
		    }, 1000);
		 });	

		 it('should run here few assertions', function (done) {
		 	  var doc;
		 	  
			 	       
	            var url = "http://localhost:3000/api/tcga_blca_pt";   
				$.ajax({
			        	url: url
				    }).error(function (err) {
				    	alert(this.name + " ERROR");
				    	throw err;
				    }).done(function (result) {
				        doc = result;	
				    });		
				assert.equal(doc.length, 412);
				debugger;
				var valid = [];
				for(var i=0;i<412;i++){
					valid[i] = ajv.validate(ptSchema, doc[i]);
					if(!valid[i]) console.log(ajv.errors);
				}
				var falseRatio = getAllIndexes(valid, false).length/doc.length;
				console.log(falseRatio);
				expect(falseRatio).to.be.below(0.1);  
	           
	      	  
	      });
		
    });
  }); 
})();
