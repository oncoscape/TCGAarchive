//var connectionString = 'mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017/os';
//var comongo = require('co-mongodb');
//var co = require('co');
//var db = "os";
const _ = require('underscore');
//var MongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");

 

var format = {
	h1: function(text) { console.log(); console.log('# '+text); },
	h2: function(text) { console.log(); console.log('## '+text); },
	h3: function(text) { console.log(); console.log('### '+text); },
	h4: function(text) { console.log(); console.log('#### '+text); },
	text: function(text){ console.log(text); },
	url: function(text) {console.log(); console.log('`' + text + '`'); console.log();},
	codeStart: function() { console.log(); console.log('```'); },
	codeComment: function(text) {console.log(); console.log('>' + text);},
	codeStop: function() { console.log(); console.log('```'); },
	code: function(text) { console.log('"'+ text + '"'); },
	jsonfy: function(text) { console.log('{' + text + '}');},
  codeRStart: function(text) { console.log("```r"); console.log(text);},
  codeMongoStart: function(text) { console.log("```mongo"); console.log(text);},
  codeJSStart: function(text) { console.log("```javascript"); console.log(text);},
  codePyStart: function(text) { console.log("```python"); console.log(text);}
};



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
 "LICH":"Liver hepatocellular carcinoma",    
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

format.h2("Mongo DB Connection");
format.codeJSStart('const mongoose = require("mongoose");');
format.code('mongoose.connect("mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin",{user: "oncoscapeRead",pass: "i1f4d9botHD4xnZ"});');
format.code('var connection = mongoose.connection;');
format.code('var db = connection.db;');
format.codeStop();
 


format.h2("Clinical Collections by Disease");

// Connect to the db
mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin', {
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
    /* First Query on lookup_oncoscape_datasources */
    collection = db.collection('lookup_oncoscape_datasources');
    collection.find().toArray(function(err, documents) {
      if (err){ console.dir(err); }
      documents.forEach(function(doc){
        format.h3(doc.disease);
        format.text(disease_code[doc.disease.toUpperCase()]);
        format.codeComment("List of collections");
        format.codeStart();
        format.text(JSON.stringify(doc.collections,null, 4));
        format.codeStop();
      });
      /* Second Query on clinical_tcga_acc_pt */
      collection = db.collection('clinical_tcga_acc_pt');
      collection.find().toArray(function(err, doc){
        var max_ind = 0;
        var max_len = 0;
        var ind = 0;
        doc.forEach(function(d){
         if(d.length > max_len){
           max_len = d.length;
           max_ind = ind;
         }
         ind = ind + 1;
        });
        format.h3("List of fields that most records have");
        format.codeComment("Fields for most of records in clinical_tcga_acc_pt");
        format.codeStart();
        format.text(Object.keys(doc[max_ind])); 
        format.codeStop(); 
        format.h3("Get the count of records in the collection");
        format.h4("HTTP Request")
        format.url("GET http://oncoscape.sttrcancer.io/api/clinical_tcga_acc_pt/count");
        format.codeComment("Count of records in clinical_tcga_acc_pt");
        format.codeStart();
        format.text(doc.length);
        format.codeStop();
        format.h3("Query detail information from collection clinical_tcga_acc_pt");

        /* Third Query on clinical_tcga_acc_pt */
        collection = db.collection('clinical_tcga_acc_pt');
        var query = '{"gender":"MALE", "race":"WHITE","$fields":["gender","race","patient_ID"],"$skip":5,"$limit":2}';
        collection.find({"gender":"MALE", "race":"WHITE"},{"patient_ID":true, "gender":true, "race":true, "histologic_diagnosis":true}).limit(2).skip(5).toArray(function(err, doc){
          format.text("Filter by gender and race and only show the selected fields");
          format.h4("HTTP Request")
          format.url("GET http://oncoscape.sttrcancer.io/api/clinical_tcga_acc_pt/?q=" + query);
          format.text("only show gender, race and patient_ID");
          format.url('"$fields":["gender","race","patient_ID"]');
          format.text("skip the first five records");
          format.url('"$skip":5');
          format.text("limit the final output to two records.");
          format.url('"$limit":2');
          format.codeComment("Male White patients result: ");
          format.codeStart();
          format.text(JSON.stringify(doc, null, 4)); 
          format.codeStop(); 
          format.codeComment("Count of the records meet this criteria");
          format.codeStart(); 
          format.text(doc.length);
          format.codeStop(); 
          
          // javascript version 
          format.codeJSStart("collection = db.collection(\"clinical_tcga_acc_pt\");");
          format.code("collection.find({\"gender\":\"MALE\", \"race\":\"WHITE\"},"+
            "{\"patient_ID\":true, \"gender\":true, \"race\":true, \"histologic_diagnosis\":true}).limit(2).skip(5).toArray(function(err, doc){);" +
            "console.log(JSON.stringify(doc, null, 4));");
          format.codeStop();
          
          // mongo shell version: not connect, --replicaSet option is specified 
          format.codeMongoStart("db.getCollection(\"clinical_tcga_acc_pt\").find({\"gender\":\"MALE\", \"race\":\"WHITE\"},{\"patient_ID\":true, \"gender\":true, \"race\":true, \"histologic_diagnosis\":true}).skip(5).limit(2)");
          format.codeStop();

          // R verion: not connect, error code 3
          format.codeRStart("install.packages(\"rmongodb\")");
          format.code("library(rmongodb)");
          format.codeStop();

          // python verion: haven't tried 
          format.codePyStart("pip install pymongo");
          format.code("from pymongo import MongoClient");
          format.code("client = MongoClient(\"mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin\")");
          format.code("db = client.os");
          format.code("db[\"clinical_tcga_acc_pt\"]");
          format.codeStop();
          process.exit(0); 
        });   
      });
    });    
});
