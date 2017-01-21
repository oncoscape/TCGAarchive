import json
from pymongo import MongoClient

# Connect & Select Database
mongo = MongoClient('localhost', 27017)
db = mongo.Staging

# Insert Projects
db.gdc_projects.delete_many({})
url = "https://gdc-api.nci.nih.gov/projects?from=1&size=500&sort=project.project_id:asc"
projects_json = requests.get(url).json()["data"]["hits"]
db.gdc_projects.insert_many(projects_json)

# Get Case Details
for project in db.gdc_projects.find({},{'_id':0,'project_id':1}):
   project_id = project["project_id"].lower().replace("-","_",-1);
   collection = "gdc_"+project_id+"_cases";
   db["gdc_"+project_id+"_cases_detail"].delete_many({});

   # Loop Cases
   for case in db[collection].find({},{'_id':0,'case_id':1}):
       url = "https://gdc-api.nci.nih.gov/cases/"+case["case_id"]+"?expand=demographic,diagnoses,exposures,family_histories,annotations,samples"
       case_json = requests.get(url).json()["data"]
       db["gdc_"+project_id+"_cases_detail"].insert_one(case_json)

[13:10]  
If you run that it will download all the GDC data and store it in mongo

new messages
[13:10]  
then if you open mongo and run this.... It will turn it into our collections...

[13:10]  
# Format Into Oncoscape Tables (Mongo Function)
var collections = db.getCollectionNames().filter(function(v) { return v.indexOf("cases_detail") != -1; }).map(function(v) {
   var parts = v.split("_");
   return { collection: v, source: parts[0], project: parts[1], disease: parts[2] };
});

# Loop Through Diseases / Break Apart Collections + Add Ids
collections.forEach(function(_collection) {
   var cases = db[_collection.collection].find();
   cases.forEach(function(_case) {
       var id = _case.submitter_id;
       if (_case.hasOwnProperty('demographic')) {
           _case.demographic.patient_id = id;
           db[_collection.disease + "_" + _collection.project + "_demographic"].insert(_case.demographic);
       }
       ['diagnoses', 'exposures', 'samples', 'annotations'].forEach(function(v) {
           if (_case.hasOwnProperty(v)) {
               db[_collection.disease + "_" + _collection.project + "_" + v].insertMany(_case[v].map(function(v) {
                   v.patient_id = id;
                   return v;
               }));
           }
       });
   });
});