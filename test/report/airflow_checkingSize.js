// go through the entire DB to record the data point numbers for each colleciton, especially the molecular colleciton
const jsonfile = require("jsonfile");
const u = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
const input = require("/usr/local/airflow/docker-airflow/onco-test/collection_counts.json");
var selectedTypes = ['mut', 'mut01', 'cnv', 'rna', 'protein', 'methylation'];
var cutoffValue = 1000;

var result = input.filter(function(m){
         return selectedTypes.contains(m.type);  
        }).filter(function(m){return m.count < cutoffValue;});
jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/CollectionSize.json", result, {spaces:4}, function(err){ console.error(err);});
