var comongo = require('co-mongodb');
var co = require('co');
var disease_tables = [];
var db, collection,db_collections,collection_name, count,manifest, manifest_content;

var format = {
	h1: function(text) { console.log(); console.log('# '+text); },
	h2: function(text) { console.log(); console.log('## '+text); },
	h3: function(text) { console.log(); console.log('### '+text); },
	h4: function(text) { console.log(); console.log('#### '+text); },
  textbold: function(text) { console.log(); console.log(); console.log('**'+ text+'**'); },
  textlist: function(text){ console.log(); console.log('- '+ text);  },
  textsublist: function(text){ console.log('  * '+ text);  },
	text: function(text){ console.log(); console.log(text);  },
	url: function(text) {console.log(); console.log('`' + text + '`'); console.log();},
	codeStart: function() { console.log(); console.log('```'); },
	codeComment: function(text) {console.log(); console.log('>' + text);},
	codeStop: function() { console.log(); console.log('```'); },
	code: function(text) { console.log('"'+ text + '"'); },
	jsonfy: function(text) { console.log('{' + text + '}');},
  codeRStart: function(text) { console.log("```r"); console.log(text);},
  codeMongoStart: function(text) { console.log("```mongo"); console.log(text);},
  codeJSStart: function(text) { console.log("```javascript"); console.log(text);},
  codePyStart: function(text) { console.log("```python"); console.log(text);},
  table: function(text){ console.log(text);  }
};

  format.codeJSStart();
  format.codeComment("To get the fields of first document and the count of the documents in collection");
  format.code('var collection = "gbm_patient_tcga_clinical";');
  format.code('var url = "https://dev.oncoscape.sttrcancer.io/api/" + collection + "/?q=";');
  format.code('$.get(url, function(data) {' +
    'var field_names = Object.keys(data[0]);' +
    'var count = data.length;' +
    'console.log("fields name of the first records: " + field_names);' +
    'console.log("counts: " + count);});'
  );
  format.codeStop();
  
        
  
