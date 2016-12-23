// var comongo = require('co-mongodb');
  
// var co = require('co');
// var onerror = function(e){
//   console.log(e);
// }

// var db, collection,db_collections,db_stats;
// var availableCollectionTags = [];
// co(function *() {

//   db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');
//   collections = yield comongo.db.collections(db);
//   // disease_tables = yield collection.find({},{"disease":true,"collections":true}).toArray();
//   collections.forEach(function(c){
//     var collection_name = c['s']['name'];
//     // var collection = yield comongo.db.collection(db, collection_name);
//     // var count = yield collection.count();
//     // console.log(count);
//     availableCollectionTags.push(collection_name);
//   });
  
//   yield comongo.db.close(db);
// }).catch(onerror);


var availableCollectionTags = [];
$(document).ready(function(){
	var encode = function(v){
			return encodeURIComponent(JSON.stringify(v));
	};

	var decode = function(v){
				return decodeURIComponent(v);
		};

	var castDataType = function(str){
		var result;
		if(str == 'false'){
			return false;
		}else if(str == 'true'){
			return true;
		}else if(str == 'null'){
			return null;	
		}else{
			if(!isNaN(Number(str))){
				result = Number(str);
			}else{
				str = str.replace(/"/g,'');
				result = JSON.stringify(str);
			}
			//return !isNaN(Number(str))? Number(str):JSON.stringify(str);
		}
		return(result);
		
	};
	// Get Reference To All Important UI Elements
	var elements = (function($){
		return{
		  diseaseBtn: $('.diseaseBtn'),
		  diseases: $('#diseaseDropDown'),
		  operations: $('#sampleBtn'),
		  query: $('#txtQuery'),
		  submit: $('#btnSubmit'),
		  results: $('#divResults'),
		  resultCollpase: $('#resCollpase'),
		  userInput:{
		      collection: $('#collectionInput'),
		      count: $('#btnCount'),
		      //countVal: $("#countVal"),
		      query: $('#criInput'),
		      fields: $('#fieldsInput'),
		      limit: $('#limitInput'),
		      skip: $('#skipInput'),
		      filter: $('#filterInput'),
		      submit: $('#cusSubmit'),
		      advanceInput:{
		              addRow: $('#add_row'),
		              delRow: $('#delete_row')
		             }
		      }
		}
	})($);
  

	function getObjects(obj, key, val) {
	    var objects = [];
	    for (var i in obj) {
	        if (!obj.hasOwnProperty(i)) continue;
	        if (typeof obj[i] == 'object') {
	            objects = objects.concat(getObjects(obj[i], key, val));
	        } else if (i == key && obj[key] == val) {
	            objects.push(obj);
	        }
	    }
	    return objects;
	}

	var getAllIndexes = function(arr, val) {
	    var indexes = [], i = -1;
	    while ((i = arr.indexOf(val, i+1)) != -1){
	        indexes.push(i);
	    }
	    return indexes;
	}

	var i=1;
	var items = [];

	

	var service = function(url, fun){
		
		$.ajax({
        	url: url
	    }).error(function (err) {
	    	alert(this.name + ' ERROR');
	    	throw err;
	    }).done(function (result) {
	        fun(result);
	    });		   
	};	

	function serviceBusy(str){
		switch (str){
			case true: 
					$('#divResults').html('');
					$('.fa-spin').show();
					break;
						
			case false: 
					$('.fa-spin').hide();
					break;
		    default: 
    				$('#divResults').html('');
    				$('.fa-spin').hide();
  
		}		
		
	};

	var populateDiseases = function(result){
        	var diseaseList = result;
        	var disease; 
        	for(var i=0; i<diseaseList.length; i++){
        		disease = diseaseList[i].disease;
				//var tables = Object.keys(diseaseList[i].collections);
				if(Object.keys(diseaseList[i]).indexOf('clinical') > -1) {
					elements.diseases.append('<li><a href=\'#\'>' + 
            		disease + '</a><ul class=\'dropdown-submenu\' id=' + disease + '></ul></li>');
					var elemID = '#'+disease;
					var tables = diseaseList[i].clinical;
					var table_keys = Object.keys(diseaseList[i].clinical);
					for(var j=0; j<table_keys.length; j++){
						$(elemID).append('<li><a href=\'#\'>' + tables[table_keys[j]] + '</a></li>');	
						availableCollectionTags.push(tables[table_keys[j]]);
					}
				}
				
			}
			$('.dropdown-submenu li a').on('click', function(e){
				serviceBusy(true);
				var str = e.target.innerText;3
				elements.diseaseBtn.val(str);
				elements.diseaseBtn.text(str);
        		elements.userInput.collection.val(str);
        		clearUserQueryPanel();
				var url = 'http://dev.oncoscape.sttrcancer.io/api/' + elements.diseaseBtn.val() + '/?q=&apikey=password';
				elements.query.text(url);
				$.get(url, function( data ) {
					elements.results.jsonViewer(data, {collapsed:false});
					elements.query.removeClass('form-control-trigger');
					setTimeout(function(){
					  elements.query.addClass('form-control-trigger');		
					}, 500);
					serviceBusy(false);					
				});
			});	
    }; 	  
	
    var diseaseSelection = function(){
    	var str = 'Choose Collection';
		  elements.diseaseBtn.text(str);
    }

    var clearUserQueryPanel = function(){
    	//elements.userInput.collection.val('');
    	elements.userInput.count.val('');
    	elements.userInput.query.val('');
    	elements.userInput.fields.val('');
    	elements.userInput.limit.val('');
    	elements.userInput.skip.val('');
    }
	// Get operations Model
	

	var fillDiseaseDropdown = (function(){
		var url = 'http://dev.oncoscape.sttrcancer.io/api/lookup_oncoscape_datasources/?q=&apikey=password'; 
		service(url, populateDiseases);

	})();

	
	elements.userInput.collection.autocomplete({source:availableCollectionTags});
	$('.ui-helper-hidden-accessible').hide();


	var customerQuery = function(items){
		var constructedURL = 'http://dev.oncoscape.sttrcancer.io/api/';
		var collection, query = [], fieldVals = [], limitVal, skipVal, filterVal; 
		var re = /\s*,\s*/;
		var re2 = /\s*:\s*/;
		
		function trimComma(str){
			str = $.trim(str);
			return (str.slice(-1) == ',') ? str.replace(/,\s*$/, '') : str;
		}

		collection = (elements.userInput.collection.val() == '' ? null:trimComma(elements.userInput.collection.val()));
		query = (elements.userInput.query.val() == '' ? null:trimComma(elements.userInput.query.val()).split(re));
		fieldVals = (elements.userInput.fields.val() == '' ? null:trimComma(elements.userInput.fields.val()).split(re));
		limitVal = (elements.userInput.limit.val() == '' ? null:trimComma(elements.userInput.limit.val()));
		skipVal = (elements.userInput.skip.val() == '' ? null:trimComma(elements.userInput.skip.val()));
		
		var string ='';

		if(items.length != 0) {

			for(var i=0;i<items.length;i++){
				if(i == 0){
					string = string + 
						 JSON.stringify($.trim(items[i].field)) + ':' 
						+ castDataType($.trim(items[i].value));
				}else{
					string = string + ', ' + 
						 JSON.stringify($.trim(items[i].field)) + ':' 
						+ castDataType($.trim(items[i].value));	
				}
				
			}
				
		}

		if(query != null){
			string = string + JSON.stringify($.trim(query[0].split(re2)[0])) + ':' 
							+ castDataType($.trim(query[0].split(re2)[1]));
			if(query.length > 1){
				for(var i=1;i<query.length;i++){
					string = string + ', ' + 
							 JSON.stringify($.trim(query[i].split(re2)[0])) + ':' 
							+ castDataType($.trim(query[i].split(re2)[1]));
				}
			}	
		}
		
		
		if(fieldVals != null){
			if(string == '') {
				//console.log('test within fieldVal');
				string = JSON.stringify('$fields')+ ':'+ JSON.stringify(fieldVals);
			}else{
				string = string + ','+ JSON.stringify('$fields')+ ':'+ JSON.stringify(fieldVals);
			}
		}

		if(limitVal != null){
			if(string == '') {
				string = JSON.stringify('$limit')+ ':'+ Number(limitVal);
			}else{
				string = string + ','+ JSON.stringify('$limit')+ ':'+  Number(limitVal);
			}
		}

		if(skipVal != null){
			if(string == '') {
				string = JSON.stringify('$skip')+ ':'+  Number(skipVal);
			}else{
				string = string+ ','+ JSON.stringify('$skip')+ ':'+ Number(skipVal);
			}
		}
		
		string = '{' + string + '}';
		//alert(string);
		
		if(elements.userInput.count.hasClass('active')) {
			constructedURL = constructedURL + collection + '/count?q=';
		}else{
			constructedURL = constructedURL + collection + '/?q=';
		}
		elements.query.text(constructedURL + string + '&apikey=password');
		constructedURL = constructedURL + encodeURIComponent(string) + '&apikey=password';

		return constructedURL;
	}

	
	elements.userInput.submit.on('click', function(){
		serviceBusy();
		if(elements.userInput.collection.val() == '') {
			alert('Please enter a Collection name!');
			return
		}else{
			serviceBusy(true);
			$.get(customerQuery(items), function( data ) {
				elements.results.jsonViewer(data, {collapsed:false});
				elements.query.removeClass('form-control-trigger');
				setTimeout(function(){
				  elements.query.addClass('form-control-trigger');		
				}, 500);
				serviceBusy(false);					
			});
		}
			
	});

});























