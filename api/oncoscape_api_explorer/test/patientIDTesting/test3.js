// Third Part
const jsonfile = require('jsonfile');
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
const u = require("underscore");
var IDReporting = require('/usr/local/airflow/docker-airflow/onco-test/ptIDs/output2.json');
var IDErrors = IDReporting.filter(function(m){
	return ('itemsNotInRef' in m.IDstatus) && (m.IDstatus.itemsNotInRef.length > 0 || m.IDstatus.refItemsNotInSelf.length>0);
});

var IDErrors_brief = IDErrors.filter(function(m){return m.IDstatus.itemsNotInRef.length!=0;})

var IDErrors_briefv2 = [];
for(var i=0; i<IDErrors_brief.length;i++){
	var elem = {};
	var el = {};
	var m = IDErrors_brief[i];
	elem.collection = m.collection;
	elem.disease = m.disease;
	elem.type = m.type;
	el.overlapCount = m.IDstatus.overlapCount;
	el.itemsNotInRefLength = m.IDstatus.itemsNotInRef.length;
	el.itemsNotInRef = m.IDstatus.itemsNotInRef;//.splice(0, 5); the longest is 7, do not need to only print the first five
	elem.IDstatus = el;
	IDErrors_briefv2.push(elem);
}

IDErrors_briefv2.sort(function(a, b){
	return b.IDstatus.itemsNotInRefLength - a.IDstatus.itemsNotInRefLength;
})

jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/ptIDs/IDstatus_errors.json", IDErrors,  {spaces: 4}, function(err){ console.error(err);}); 
jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/ptIDs/IDstatus_errors_brief.json", IDErrors_briefv2,  {spaces: 4}, function(err){ console.error(err);}); 

