console.time();
const geneIDReporting = require('/usr/local/airflow/docker-airflow/onco-test/geneSymbols/output2.json');
const jsonfile = require("jsonfile");
const input = require("/usr/local/airflow/docker-airflow/onco-test/dataStr/ajv_test2.json");
const u = require("underscore");
const helper = require("/usr/local/airflow/docker-airflow/onco-test/testingHelper.js");
var HGNC = require("./HGNC_complete.json");
var HGNC_geneSymbols = HGNC.response.docs.map(function(s){return s.symbol;});
var HGNC_genePrevSymbols = HGNC.response.docs.filter(function(s){return ("prev_symbol" in s);}).map(function(m){return m.prev_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneAliasSymbols = HGNC.response.docs.filter(function(s){return ("alias_symbol" in s);}).map(function(m){return m.alias_symbol;}).reduce(function(a, b){return a.concat(b);});
var HGNC_geneCosmicSymbols = HGNC.response.docs.filter(function(s){return ("cosmic" in s);}).map(function(m){return m.cosmic;});
var HGNC_geneCDSymbols = HGNC.response.docs.filter(function(s){return ("cd" in s);}).map(function(m){return m.cd;});
var HGNC_geneLNCRNADBSymbols = HGNC.response.docs.filter(function(s){return ("lncrnadb" in s);}).map(function(m){return m.lncrnadb;});

var geneIDErrors_brief = geneIDReporting.filter(function(m){
    return ('itemsNotInRef' in m.geneIDstatus) && (m.geneIDstatus.itemsNotInRef.length > 0);
}).map(function(m){
    console.log(m.collection);
    var elem = {};
    var el = {};
    var notIncludes = m.geneIDstatus.itemsNotInRef;
    elem.collection = m.collection;
    elem.disease = m.disease;
    elem.type = m.type;
    el.countInRef = m.geneIDstatus.countInRef;
    el.itemsNotInHGNCSymbolsLength = notIncludes.length;
    //el.itemsNotInHGNCSymbols = notIncludes.splice(0, 5);
    
    var withPrev = notIncludes.includesArray(HGNC_genePrevSymbols);
    var withAlias = withPrev.notIncluded.includesArray(HGNC_geneAliasSymbols);
    var withCosmic = withAlias.notIncluded.includesArray(HGNC_geneCosmicSymbols);
    var withCD = withCosmic.notIncluded.includesArray(HGNC_geneCDSymbols);
    var withLNCRNADB = withCD.notIncluded.includesArray(HGNC_geneLNCRNADBSymbols);
    
    el.NotInGeneSymButInPrevLength = withPrev.includes.length;
    el.NotInGeneSymButInAliasLength = withAlias.includes.length;
    el.NotInGeneSymButInCosmicLength = withCosmic.includes.length;
    el.NotInGeneSymButInCDLength = withCD.includes.length;
    el.NotInGeneSymButInLNCRNADBLength = withLNCRNADB.includes.length;
    el.NotInAnyLength = withLNCRNADB.notIncluded.length;
    el.NotInAny = withLNCRNADB.notIncluded;
    elem.geneIDstatus = el;
    return elem;
}).sort(function(a, b){
    return b.geneIDstatus.NotInAnyLength - a.geneIDstatus.NotInAnyLength;
});

jsonfile.writeFile("/usr/local/airflow/docker-airflow/onco-test/geneSymbols/geneIDstatus_errors_brief.json", geneIDErrors_brief,  {spaces: 4}, function(err){ console.error(err);}); 
console.timeEnd();



