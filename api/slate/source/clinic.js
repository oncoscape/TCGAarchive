//http://www.csvjson.com/csv2json 
var jsonfile = require("jsonfile");
var cbio_annotation = {};
var ucsc_annotation = {};
// var cbio_annot = cbio_annotation.filter(function(c){
//     if('collection' in c) 
//       return typeof c != 'undefined'
//  });
// jsonfile.readFile("cbio_annot.json", function(err, obj) {
//   cbio_annotation = obj;
// });

// cbio_annotation = cbio_annotation.map(function(c){
//    var elem = {};
//    elem.source = c.source;
//    elem.type = c.type;
//    elem.collection = c.collection;
//    elem.sampleSize = c.sampleSize;
//    elem.GENETIC_ALTERATION_TYPE = c.GENETIC_ALTERATION_TYPE;
//    elem.DATATYPE = c.DATATYPE;
//    elem.NAME = c.NAME;
//    elem.DESCRIPTION = c.DESCRIPTION;
//    return elem;
//  });
//  jsonfile.writeFile("cbio_annot_reorganized.json", cbio_annotation);

jsonfile.readFile("cbio_annot_reorganized.json", function(err, obj) {
  cbio_annotation = obj;
});


jsonfile.readFile("ucsc_mol_annotation.json", function(err, obj) {
  ucsc_annotation = obj;
});

var comongo = require('co-mongodb');
var co = require('co');
var disease_tables = [];
var db, collection,db_collections,collection_name, count,manifest, manifest_content;
var diseases = [];
var availableCollectionTags = [];
var keys = [];
var manifest_length;
var dataset = [];
var dataType = [];
var date = [];
var manifestCollection = [];
var source = [];
var parent = [];
var unique_keys;
var unique_datasets;
var unique_datasets_length;
var unique_dataTypes;
var unique_dates;
var unique_collections;
var unique_sources;
var unique_parents;
var lookup_oncoscape_datasources, datasources;
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
	codeComment: function(text) {console.log(); console.log('> ' + text); console.log(); },
	codeStop: function() {console.log('```');  console.log(); },
	code: function(text) { console.log('"'+ text + '"'); },
	jsonfy: function(text) { console.log('{' + text + '}');},
  codeRStart: function(text) {  console.log(); console.log("```r");},
  codeMongoStart: function(text) {  console.log(); console.log("```shell"); },
  codeJSStart: function(text) {  console.log(); console.log("```javascript"); },
  codePyStart: function(text) {  console.log(); console.log("```python"); },
  codeJSONStart: function(text) {  console.log(); console.log("```json"); },
  table: function(text){ console.log(text);  }
};



var disease_code = {
     "HG19" : "Genome Platform",
     "BRAIN": "Lower Grade Glioma & Glioblastoma multiforme",
     "COADREAD": "Colon adenocarcinoma & Rectum adenocarcinoma",
     "LAML" : "Acute Myeloid Leukemia",
     "ACC":"Adrenocortical carcinoma",
     "BLCA" : "Bladder Urothelial Carcinoma",
     "LGG": "Brain Lower Grade Glioma",
     "BRCA": "Breast invasive carcinoma",
     "CESC": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",  
     "CHOL":"Cholangiocarcinoma",
     "COAD":"Colon adenocarcinoma", 
     "ESCA":"Esophageal carcinoma",  
     "GBM":"Glioblastoma multiforme",    
     "HNSC":"Head and Neck squamous cell carcinoma", 
     "KICH":"Kidney Chromophobe",
     "KIRC":"Kidney renal clear cell carcinoma", 
     "KIRP":"Kidney renal papillary cell carcinoma", 
     "LICH":"Liver hepatocellular carcinoma",    
     "LUAD":"Lung adenocarcinoma",   
     "LUSC":"Lung squamous cell carcinoma",  
     "LUNG":"Lung adenocarcinoma & Lung squamous cell carcinoma",
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

// format.h2("Mongo DB Connection");
// format.codeJSStart('const mongoose = require(\"mongoose\");');
// format.table('mongoose.connect(\"mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin\",{user: \"oncoscapeRead\",pass: \"i1f4d9botHD4xnZ\"});');
// format.table('var connection = mongoose.connection;');
// format.table('var db = connection.db;');
// format.codeStop();

var onerror = function(e){
    console.log(e);
  };



Array.prototype.contains = function(v) {
      for(var i = 0; i < this.length; i++) {
          if(this[i] === v) return true;
      }
      return false;
  };

Array.prototype.getAllIndexes = function(v) {
      var indexes = [], i = -1;
      while ((i = this.indexOf(v, i+1)) != -1){
          indexes.push(i);
      }
      return indexes;
  };
Array.prototype.unique = function() {
      var arr = [];
      for(var i = 0; i < this.length; i++) {
          if(!arr.contains(this[i])) {
              arr.push(this[i]);
          }
      }
      return arr; 
  };

function filterByCollection(obj, val) {
  if (obj.collection !== undefined && typeof(obj.collection) === 'string' && obj.collection === val) {
    //return true;
    return obj;
  } else {
    invalidEntries++;
    return false;
  }
}

Array.prototype.filterByCollection = function(v){
  for(var i = 0; i < this.length; i++) {
    if(this[i].collection === v){
      //console.log(this[i].collection);
      return this[i];
    } 
  }
  return false;
};

//ucsc_annotation.filterByCollection('cesc_cnv_ucsc_gistic2thd')

var invalidEntries = 0;
function filterByDataSet(value, obj) {
  if ('dataset' in obj && typeof(obj.dataset) === 'string' && obj.dataset === value) {
    return true;
  } else {
    invalidEntries++;
    return false;
  }
}

function filterByDataType(value, obj) {
  if ('dataType' in obj && typeof(obj.dataType) === 'string' && obj.dataType === value) {
    return true;
  } else {
    invalidEntries++;
    return false;
  }
}

function filterByDataTypeCat(value, obj) {
  if ('dataTypeCat' in obj && typeof(obj.dataTypeCat) === 'string' && obj.dataTypeCat === value) {
    return true;
  } else {
    invalidEntries++;
    return false;
  }
}

co(function *() {

  db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');
  
  /* REST API Query on gbm_patient_tcga_clinical */
  collection = yield comongo.db.collection(db, 'gbm_patient_tcga_clinical');
  var doc = yield collection.find({}).toArray();
  // var max_ind = 0;
  // var max_len = 0;
  // var ind = 0;
  format.h2("Example to access one collection from browser");
  format.h3("HTTP Request");
  format.url("GET http://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical/");
  format.codeComment("Here we only show the first record in gbm_patient_tcga_clinical");
  format.codeStart();
  format.text(JSON.stringify(doc[0], null, 4)); 
  format.codeStop(); 
  // format.h2("Get the count of records in the collection");
  // format.h3("HTTP Request");
  // format.codeComment('Male White patients result: ');
  // format.codeStart();
  // format.text(JSON.stringify(doc, null, 4)); 
  // format.codeStop(); 
  // format.codeComment('Count of the records meet this criteria');
  // format.codeStart(); 
  // format.text(doc.length);
  // format.codeStop(); 
  // format.url("GET http://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical/count");
  // format.codeComment("Count of records in gbm_patient_tcga_clinical");
  // format.codeStart();
  // format.text(doc.length);
  // format.codeStop();
  format.h2("Query Collection from Browser");
  format.h3("HTTP Request");
  var query = '{"gender":"MALE", "race":"WHITE","$fields":["gender","race","patient_ID"],"$skip":5,"$limit":2}';
  doc = yield collection.find({"gender":"MALE", "race":"WHITE"},{"patient_ID":true, "gender":true, "race":true, "histologic_diagnosis":true}).limit(2).skip(5).toArray();
  format.codeComment('Here we show the first two records that meet the below criteria: gender is male, race is white. We have skipped the first five records from the results. And we only show three fields (patient_ID, gender and race.');
  format.codeStart();
  format.text(JSON.stringify(doc, null, 4)); 
  format.codeStop(); 
  format.text("Filter by gender and race and only show the selected fields");
  format.url("GET http://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical/?q=" + query);
  format.text("only show gender, race and patient_ID");
  format.url('"$fields":["gender","race","patient_ID"]');
  format.text("skip the first five records");
  format.url('"$skip":5');
  format.text("limit the final output to two records.");
  format.url('"$limit":2');
      
  format.h2("Fetch JSON-Formatted Data Using Programming Languages"); 
  format.codeComment('Fetch JSON formatted data using R, Python, or javascript');   
  // mongo shell version 
  // format.codeMongoStart();
  // format.table('collection = db.collection(\"gbm_patient_tcga_clinical\");');
  // format.table('collection.find({\"gender\":\"MALE\", \"race\":\"WHITE\"}, {\"patient_ID\":true, \"gender\":true,');
  // format.table(' \"race\":true, \"histologic_diagnosis\":true})');
  // format.table('          .limit(2).skip(5).toArray(function(err, doc){);');
  // format.table('console.log(JSON.stringify(doc, null, 4));');
  // format.codeStop();

  // javascript version 
  format.codeJSStart();
  format.table('var collection = \"gbm_patient_tcga_clinical\";');
  format.table('var url = \"https://dev.oncoscape.sttrcancer.io/api/\" + collection + \"/?q=\";');
  format.table('$.get(url, function(data) {'); 
  format.table('     var field_names = Object.keys(data[0]);');
  format.table('     var count = data.length;');
  format.table('     console.log("fields name of the first records: " + field_names);');
  format.table('     console.log("counts: " + count);');
  format.table('  });');
  format.codeStop();

  // mongo shell version: not connect, --replicaSet option is specified 
  // format.codeMongoStart();
  // format.table('db.getCollection(\"gbm_patient_tcga_clinical\").');
  // format.table('find({\"gender\":\"MALE\", \"race\":\"WHITE\"},{\"patient_ID\":true, \"gender\":true, \"race\":true, \"histologic_diagnosis\":true}).skip(5).limit(2)');
  // format.codeStop();

  // R verion: not connect, error code 3
  format.codeRStart();
  format.table('install.packages(\"jsonlite\")');
  format.table('install.packages(\"curl\")');
  format.table('library(jsonlite)');
  format.table('library(curl)');
  format.table('gbm_patient <- fromJSON(\"https://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical\")');
  format.table('str(gbm_patient, max.level=2)');
  format.table('\'data.frame\': 596 obs. of  33 variables:');
  format.table('\$ patient_ID                         : chr  "TCGA-02-0001-01" "TCGA-02-0003-01" "TCGA-02-0004-01" "TCGA-02-0006-01" ...');
  format.table('\$ history_lgg_dx_of_brain_tissue     : logi  FALSE FALSE FALSE FALSE FALSE FALSE ...');
  format.table('\$ prospective_collection             : logi  NA NA NA NA NA NA ...');
  format.table('\$ retrospective_collection           : logi  NA NA NA NA NA NA ...');
  format.table('\$ gender                             : chr  "FEMALE" "MALE" "MALE" "FEMALE" ...');
  format.table('\$ days_to_birth                      : int  -16179 -18341 -21617 -20516 -14806 -22457 -7452 -6926 -9369 -18404 ...');
  format.table('\$ race                               : chr  "WHITE" "WHITE" "WHITE" "WHITE" ...');
  format.table('\$ ethnicity                          : chr  "NOT HISPANIC OR LATINO" "NOT HISPANIC OR LATINO" "NOT HISPANIC OR LATINO" "NOT HISPANIC OR LATINO" ...');
  format.table('\$ history_other_malignancy           : logi  NA NA NA NA NA NA ...');
  format.table('\$ history_neoadjuvant_treatment      : logi  TRUE FALSE FALSE FALSE TRUE FALSE ...');
  format.table('\$ diagnosis_year                     : int  1009872000 1041408000 1009872000 1009872000 1009872000 1041408000 1009872000 1072944000 852105600 1009872000 ...');
  format.table('\$ pathologic_method                  : logi  NA NA NA NA NA NA ...');
  format.table('\$ pathologic_method                  : logi  NA NA NA NA NA NA ...');
  format.table('\$ status_vital                       : chr  "DEAD" "DEAD" "DEAD" "DEAD" ...');
  format.table('\$ days_to_last_contact               : int  279 144 345 558 705 322 1077 630 2512 627 ...');
  format.table('\$ days_to_death                      : int  358 144 345 558 705 322 1077 630 2512 627 ...');
  format.table('\$ status_tumor                       : chr  "WITH TUMOR" "WITH TUMOR" "WITH TUMOR" "WITH TUMOR" ...');
  format.table('\$ KPS                                : int  80 100 80 80 80 80 80 80 100 80 ...');
  format.table('\$ ECOG                               : int  NA NA NA NA NA NA NA NA NA NA ...');
  format.table('\$ encounter_type                     : chr  NA NA NA NA ...');
  format.table('\$ radiation_treatment_adjuvant       : logi  NA NA NA NA NA NA ...');
  format.table('\$ pharmaceutical_tx_adjuvant         : logi  NA NA NA NA NA NA ...');
  format.table('\$ treatment_outcome_first_course     : chr  NA NA NA NA ...');
  format.table('\$ new_tumor_event_diagnosis          : logi  NA NA NA NA NA NA ...');
  format.table('\$ age_at_initial_pathologic_diagnosis: int  44 50 59 56 40 61 20 18 25 50 ...');
  format.table('\$ anatomic_organ_subdivision         : logi  NA NA NA NA NA NA ...');
  format.table('\$ days_to_diagnosis                  : int  0 0 0 0 0 0 0 0 0 0 ...');
  format.table('\$ disease_code                       : logi  NA NA NA NA NA NA ...');
  format.table('\$ histologic_diagnosis               : chr  "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" ...');
  format.table('\$ icd_10                             : chr  "C71.9" "C71.9" "C71.9" "C71.9" ...');
  format.table('\$ icd_3_histology                    : chr  "9440/3" "9440/3" "9440/3" "9440/3" ...');
  format.table('\$ icd_3                              : chr  "C71.9" "C71.9" "C71.9" "C71.9" ...');
  format.table('\$ tissue_source_site_code            : chr  "02" "02" "02" "02" ...');
  format.table('\$ tumor_tissue_site                  : chr  "BRAIN" "BRAIN" "BRAIN" "BRAIN" ...');
  format.codeStop();

  // python verion: haven't tried 
  var python_json_obj = [
    {
        "ECOG": null, 
        "KPS": 80, 
        "age_at_initial_pathologic_diagnosis": 44, 
        "anatomic_organ_subdivision": null, 
        "days_to_birth": -16179, 
        "days_to_death": 358, 
        "days_to_diagnosis": 0, 
        "days_to_last_contact": 279, 
        "diagnosis_year": 1009872000, 
        "disease_code": null, 
        "encounter_type": null, 
        "ethnicity": "NOT HISPANIC OR LATINO", 
        "gender": "FEMALE", 
        "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY", 
        "history_lgg_dx_of_brain_tissue": false, 
        "history_neoadjuvant_treatment": true, 
        "history_other_malignancy": null, 
        "icd_10": "C71.9", 
        "icd_3": "C71.9", 
        "icd_3_histology": "9440/3", 
        "new_tumor_event_diagnosis": null, 
        "pathologic_method": null, 
        "patient_ID": "TCGA-02-0001-01", 
        "pharmaceutical_tx_adjuvant": null, 
        "prospective_collection": null, 
        "race": "WHITE", 
        "radiation_treatment_adjuvant": null, 
        "retrospective_collection": null, 
        "status_tumor": "WITH TUMOR", 
        "status_vital": "DEAD", 
        "tissue_source_site_code": "02", 
        "treatment_outcome_first_course": null, 
        "tumor_tissue_site": "BRAIN"
    }, 
    {
        "ECOG": null, 
        "KPS": 100, 
        "age_at_initial_pathologic_diagnosis": 50, 
        "anatomic_organ_subdivision": null, 
        "days_to_birth": -18341, 
        "days_to_death": 144, 
        "days_to_diagnosis": 0, 
        "days_to_last_contact": 144, 
        "diagnosis_year": 1041408000, 
        "disease_code": null, 
        "encounter_type": null, 
        "ethnicity": "NOT HISPANIC OR LATINO", 
        "gender": "MALE", 
        "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY", 
        "history_lgg_dx_of_brain_tissue": false, 
        "history_neoadjuvant_treatment": false, 
        "history_other_malignancy": null, 
        "icd_10": "C71.9", 
        "icd_3": "C71.9", 
        "icd_3_histology": "9440/3", 
        "new_tumor_event_diagnosis": null, 
        "pathologic_method": null, 
        "patient_ID": "TCGA-02-0003-01", 
        "pharmaceutical_tx_adjuvant": null, 
        "prospective_collection": null, 
        "race": "WHITE", 
        "radiation_treatment_adjuvant": null, 
        "retrospective_collection": null, 
        "status_tumor": "WITH TUMOR", 
        "status_vital": "DEAD", 
        "tissue_source_site_code": "02", 
        "treatment_outcome_first_course": null, 
        "tumor_tissue_site": "BRAIN"
    }
];
  format.codePyStart();
  format.codeComment('shell commands: sudo pip install pymongo, simplejson, urllib2, json');
  format.table('import urllib2');
  format.table('import json');
  format.table('import simplejson');
  format.table('url = \"https://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical\"');
  format.table('response = urlli2.urlopen(url)');
  format.table('data = simplejson.load(response)');
  format.table('print json.dumps(data[0:2], indent=4, sort_keys=True)');
  format.text(JSON.stringify(python_json_obj, null, 4)); 
  format.codeStop();
  format.text("Users can access json-formatted data using URL link.");
  format.text("Here we show the example to access one collection using four different languages.");
  
  //=========================================================================
  /* using lookup_oncoscape_datasources file to populate _clinic_api_query.md 
  */
  format.h1("Collections by Disease");
  lookup_oncoscape_datasources = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
  datasources = yield lookup_oncoscape_datasources.find({}).toArray();
  var datasource_count = yield lookup_oncoscape_datasources.count();
  //yield comongo.db.close(db);

  unique_datasets_length = datasources.length;
  var dataTypeCat = ['category','clinical', 'molecular'];
  var dataTypeCat_length = dataTypeCat.length;
  var elem_source, elem_dataType;

  for(var i=0;i<unique_datasets_length;i++){
    if("disease" in datasources[i]){
      format.h2(datasources[i].disease.toUpperCase() + " - " + disease_code[datasources[i].disease.toUpperCase()]);
      var datasource = datasources[i];
      var mol_colls = [];
      //db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin&replicaSet=rs0');
      format.text("Collection Name | Collection Type | Data Source | Data Type");
      format.table("--------- | ----------- | ----------- | -----------"); 
      elem_source = datasource.source;
      elem_dataType = "";
      for(var j=0; j<dataTypeCat_length; j++){
         if(dataTypeCat[j] in datasource){
            if(Array.isArray(datasource[dataTypeCat[j]])) {
                datasource[dataTypeCat[j]].forEach(function(elem){
                  elem_source = elem.source;
                  elem_dataType = elem.type; 
                  if('collection' in elem){
                    format.table(elem.collection + " | " + dataTypeCat[j] + " | " + elem_source + " | " + elem_dataType);
                  }else{
                    format.table(elem.name + " | " + dataTypeCat[j] + " | " + elem_source + " | " + elem_dataType);
                  }
                  if(dataTypeCat[j] === 'molecular'){
                    mol_colls.push(elem);
                  }
                }); 
            }else{
                var elems = Object.keys(datasource[dataTypeCat[j]]);
                var elems_length = elems.length;
                for(var m=0; m<elems_length;m++){
                  format.table(datasource[dataTypeCat[j]][elems[m]] + " | " + dataTypeCat[j] + " | " + elem_source + " | " + elem_dataType);
                }
            }
            
          }
         
      }
      format.h3("More Details of Molecular Collections");
      if(mol_colls.length !== 0) {
        var mol_annot = [];
        mol_colls.forEach(function(e){
          if(e.source === 'ucsc'){
                      format.codeStart();
                      var annot = ucsc_annotation.filterByCollection(e.collection);
                      format.text(JSON.stringify(annot, null, 4)); 
                      format.codeStop();
                      mol_annot.push(annot);
          }else if(e.source === 'cBio'){
                      var annot = cbio_annotation.filterByCollection(e.collection);
                      if(annot != false){
                        // var e_coll = yield comongo.db.collection(db, e.collection);
                        // var e_coll_count = yield e.collection.count();
  
                        format.codeStart();
                        format.text(JSON.stringify(annot, null, 4)); 
                        format.codeStop();
                        mol_annot.push(annot);
                      }
                      
          }
        });
        format.text("Collection | Data Source | Data Type | Size | Description");
        format.table("--------- | ----------- | ----------- | ----------- | -----------"); 
        mol_annot.forEach(function(e){
          format.table(e.collection + " | " +
                       e.source + " | " +
                       e.type + " | " +
                       e.sampleSize + " | " + 
                       e.description);
        });

      }
      

      
      
    }
   
  }
  yield comongo.db.close(db);
}).catch(onerror);
  


 