const u = require("underscore");
const jsonfile = require("jsonfile");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
var render_patient = require("/usr/local/airflow/docker-airflow/onco-test/render_patient.json");
var render_patient_cluster = render_patient.filter(function(m){return m.type == 'cluster';});
var x_range = render_patient_cluster.map(function(r){
	var elem = {};
	elem.disease = r.dataset;
	elem.name = r.name;
	elem.type = r.type;
	elem.scale = r.scale;
	var patients = Object.keys(r.data);
	var sorted = patients.map(function(p){return r.data[p].x;}).sort();
	elem.range = u.last(sorted) - u.first(sorted);
	return elem;
});

jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/x_range.json", x_range, {spaces:4}, function(err){ console.error(err);});
 
