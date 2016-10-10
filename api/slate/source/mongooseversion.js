//var connectionString = 'mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017/os';
//var comongo = require('co-mongodb');
//var co = require('co');
//var db = "os";
const _ = require('underscore');
const mongoose = require("mongoose");


 

var format = {
	h1: function(text) { console.log(); console.log('# '+text); },
	h2: function(text) { console.log(); console.log('## '+text); },
	h3: function(text) { console.log(); console.log('### '+text); },
	h4: function(text) { console.log(); console.log('#### '+text); },
	text: function(text){ console.log(text); },
	url: function(text) {console.log(); console.log('`' + text + '`');},
	codeStart: function() { console.log(); console.log('```'); },
	codeComment: function(text) {console.log(); console.log('>' + text);},
	codeStop: function() { console.log(); console.log('```'); },
	code: function(text) { console.log('"'+ text + '"'); },
	jsonfy: function(text) { console.log('{' + text + '}');}
};





var onerror = function(e){
	console.log(e);
}

var disease_code = {
   "LAML" : "Acute Myeloid Leukemia",
   "ACC":"Adrenocortical carcinoma",
   "BLCA" : "Bladder Urothelial Carcinoma",
   "LGG": "Brain Lower Grade Glioma",
   "BRCA": "Breast invasive carcinoma",
   "CESC": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",  
   "CHOL":"Cholangiocarcinoma",
   "COAD ":"Colon adenocarcinoma", 
   "ESCA":"Esophageal carcinoma",  
   "GBM":"Glioblastoma multiforme",    
   "HNSC":"Head and Neck squamous cell carcinoma", 
   "KICH":"Kidney Chromophobe",
   "KIRC":"Kidney renal clear cell carcinoma", 
   "KIRP":"Kidney renal papillary cell carcinoma", 
   "LIHC":"Liver hepatocellular carcinoma",    
   "LUAD":"Lung adenocarcinoma",   
   "LUSC":"Lung squamous cell carcinoma",  
   "DLBC":"Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
   "MESO":"Mesothelioma",
   "OV":"Ovarian serous cystadenocarcinoma",   
   "PAAD":"Pancreatic adenocarcinoma", 
   "PCPG":"Pheochromocytoma and Paraganglioma",    
   "PRAD":"Prostate adenocarcinoma",   
   "READ":"Rectum adenocarcinoma", 
   "SARC":"Sarcoma",   
   "SKCM":"Skin Cutaneous Melanoma",   
   "STAD":"Stomach adenocarcinoma",    
   "TGCT":"Testicular Germ Cell Tumors",   
   "THYM":"Thymoma",   
   "THCA":"Thyroid carcinoma", 
   "UCS":"Uterine Carcinosarcoma",
   "UCEC":"Uterine Corpus Endometrial Carcinoma",  
   "UVM":"Uveal Melanoma"
   };
format.h2("Clinical Collections by Disease");


mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/os?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var connection = mongoose.connection;
connection.once('open', function(){

    var db = connection.db;
    var collection = db.collection('lookup_oncoscape_datasources');


    console.log("YAY WE ARE CONNECT + HAVE A COLLECTION");


    collection.find().toArray(function(err, documents){

      if (err){ exit(1); }

      documents.forEach(function(doc){

      format.h3(doc.disease);
      format.text(disease_code[doc.disease.toUpperCase()]);
      format.codeComment("List of collections");
      format.codeStart();
      format.text(JSON.stringify(doc.collections,null, 4));
      format.codeStop();
    
      });





    });

    // var result = collection.find().toArray(function(err, documents){
    //   console.dir(err);
    //   console.log("-----");
    //   console.dir(documents);

    // });


});



     
// 	db.close();		
//   }else{
//   	onerror(err.errmsg);
//   }
// }); 


// MongoClient.connect("mongodb://localhost:27017/oncoscape", function(err, db) {
//   if(!err) {
//   	format.h2("Query Disease Collections");
//   	format.text("Query detail information from collection tcga_acc_drug");
//     var collection = db.collection('tcga_acc_drug');
//     collection.find().toArray(function(err, doc){
//     	var max_ind = 0;
//     	var max_len = 0;
//     	var ind = 0;
//     	doc.forEach(function(d){
//     		if(d.length > max_len){
//     			max_len = d.length;
//     			max_ind = ind;
//     		}
//     		ind = ind + 1;
//     	});
//     	format.h3("List of fields that most records have");
//     	format.codeComment("Fields for most of records in tcga_acc_drug");
//     	format.codeStart();
//     	format.text(Object.keys(doc[max_ind]));	
//     	format.codeStop(); 
//     	format.h3("Get the count of records in the collection");
//     	format.h4("HTTP Request")
//     	format.url("GET http://oncoscape.sttrcancer.io/api/tcga_acc_drug/count");
//     	format.codeComment("Count of records in tcga_acc_drug");
//     	format.codeStart();
//     	format.text(doc.length);
//     	format.codeStop(); 
//     });

// 	db.close();		
//   }else{
//   	onerror(err.errmsg);
//   }
// }); 

// MongoClient.connect("mongodb://localhost:27017/oncoscape", function(err, db) {
//   if(!err) {
//     format.text("Query detail information from collection tcga_acc_drug");
//     var collection = db.collection('tcga_acc_drug');
//     var query = '{"drug_therapy_name":"SUNITINIB"}';
//     console.log(query);
//     collection.find({"drug_therapy_name":"SUNITINIB"}).toArray(function(err, doc){
//       format.h3("Filter by Drug Name");
//       format.h4("HTTP Request")
//       format.url("GET http://oncoscape.sttrcancer.io/api/tcga_acc_drug/?q=" + query);
//       format.codeComment("all the patients have been used on SUNITINIB");
//       format.codeStart();
//       format.text(JSON.stringify(doc, null, 4)); 
//       format.codeStop(); 
//       format.codeComment("Count of the records meet this criteria");
//       format.codeStart(); 
//       format.text(doc.length);
//       format.codeStop(); 
//     });

//   db.close();   
//   }else{
//     onerror(err.errmsg);
//   }
// }); 


