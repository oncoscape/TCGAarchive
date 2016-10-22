Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.arraysCompare = function(ref) {
    var elem = {};
    elem.countInRef = 0;
    elem.itemsNotInRef = [];
    for(var i = 0; i < this.length; i++) {
        if(ref.indexOf(this[i]) > -1){
          elem.countInRef++;
        }else{
          elem.itemsNotInRef.push(this[i]);
        }
    }
    return elem;
};

Object.prototype.nestedUniqueCount = function(){
    var errorCount = {};
    var ar = [];
    var str;
    this['errors'].forEach(function(a){
        a.errorType.forEach(function(e){
          str = e.schemaPath + " [message: "+ e.message + "]; Number of Violation: ";  
          if(ar.contains(str)){
            errorCount[str]++;
          }else{
            ar.push(str);
            errorCount[str]=1;
          }
        });
    });
    return errorCount;
};

Array.prototype.arraysCompareV2 = function(ref) {
    var elem = {};
    elem.overlapCount = 0;
    elem.itemsNotInRef = [];
    elem.refItemsNotInSelf = [];
    for(var i = 0; i < this.length; i++) {
        if(ref.indexOf(this[i]) > -1){
          elem.overlapCount++;
        }else{
          elem.itemsNotInRef.push(this[i]);
        }
    }
    for(var j = 0; j < ref.length; j++){
        if(this.indexOf(ref[j]) == -1){
          elem.refItemsNotInSelf.push(ref[j]);
        }
    }
    return elem;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(arr.indexOf(this[i]) === -1) {
            arr.push(this[i]);
        }
    }
    return arr; 
};

Array.prototype.findTypeByCollection = function(v){
  for(var i = 0; i < this.length; i++) {
    if(this[i].collection === v){
      //console.log(this[i].collection);
      //return this[i].dataType;
      return this[i].dataType;
    } 
  }
  return false;
};

Array.prototype.findSubSetByCollectionNames = function(ref){
  var subset = []; 
  for(var i = 0; i < this.length; i++) {
    for(var j=0; j < ref.length; j++){
      if(ref[j].collection == this[i]) subset.push(ref[j]);
    }
  }
  return subset;
};

Array.prototype.findCollectionsByDisease = function(d){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].disease === d){
      arr.push(this[i]);
    } 
  }
  return arr;
};

Array.prototype.findScoreByDiseaseByType = function(t, d) {
  var passedRateArray = [];
  this.forEach(function(a){
    if(a.type==t && a.disease==d) 
      passedRateArray.push(a.passedRate);
  });
  return passedRateArray;
};

Array.prototype.findObjByDiseaseByType = function(t, d) {
  var arr = [];
  this.forEach(function(a){
    if(a.type==t && a.disease==d) 
      arr.push(a);
  });
  return arr;
};

Array.prototype.findCollectionsByType = function(v){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].type === v){
      arr.push(this[i].collection);
    } 
  }
  return arr;
};

Array.prototype.findObjsByType = function(v){
  var arr = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].type === v){
      arr.push(this[i]);
    } 
  }
  return arr;
};

Array.prototype.table = function(uniqueArray) {
    var elem = {};
    uniqueArray.forEach(function(u){
        elem[u] = 0;
    });
    for(var i = 0; i < this.length; i++){
        if(uniqueArray.indexOf(this[i]['errorType']) > -1){
            elem[this[i]['errorType']]++;
        }
    }
    return elem;

};

Array.prototype.frequency = function(){
    var elem = {};
    var uniqueArray = this.unique();
    uniqueArray.forEach(function(u){
        elem[u] = 0;
    });
    for(var i = 0; i < this.length; i++){
        if(uniqueArray.indexOf(this[i]) > -1){
            elem[this[i]]++;
        }
    }
    return elem;
};

Object.prototype.nestedUnique = function(){
    var ar = [];
    this['errors'].forEach(function(a){
        ar.push(a['errorType']);
    });
    return ar.unique();
};

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
  table: function(text){ console.log(text);  },
  inline: function(arr){
    var line1 = arr[0];
    var line2 = "---------";
    for(var i=1;i<arr.length;i++){
      line1 = line1 + " | " + arr[i];
    }
    console.log(line1);

    for(var i=1;i<arr.length;i++){
      line2 = line2 + " | " + "---------";
    }
    console.log(line2);
  }
};


var jsonfile = require("jsonfile-promised");
var patientIDs_status, patientID_errors,collections;
var cnv_p, meth_p, mut01_p, mut_p, rna_p, prot_p, woMol_p;
jsonfile.readFile("status_meth_10202016.json").then(function(res){meth_p =res;});
jsonfile.readFile("status_mut01_10202016.json").then(function(res){mut01_p =res;});
jsonfile.readFile("status_cnv_10202016.json").then(function(res){cnv_p =res;});
jsonfile.readFile("status_mut01_10202016.json").then(function(res){mut01_p =res;});
jsonfile.readFile("status_rna_10202016.json").then(function(res){rna_p =res;});
jsonfile.readFile("status_mut_10202016.json").then(function(res){mut_p =res;});
jsonfile.readFile("status_protein_10202016.json").then(function(res){prot_p =res;});
jsonfile.readFile("status_woMol_10202016.json").then(function(res){woMol_p =res;});

patientID_errors = cnv_p.concat(meth_p, mut01_p, mut_p, rna_p, meth_p, woMol_p);
jsonfile.writeFile("patientIDstatus_10202016.json", patientID_errors, {spaces:4});

//jsonfile.readFile("patientIDstatus_10202016.json").then(function(res){patientID_errors =res;});

//******************************************************************************
//patientID_errors.length = 3545
//collections.length = 5669
jsonfile.readFile("../collection_counts.json").then(function(res){collections = res;}); 
var IDChecked = patientID_errors.map(function(p){return p.collection;});
var allCollections = collections.map(function(c){return c.collection;});
var IDNotChecked = IDChecked.arraysCompareV2(allCollections).refItemsNotInSelf; //2133 items

// var uID = IDChecked.unique();
// Array.prototype.frequency = function(){
//     var elem = {};
//     var uniqueArray = this.unique();
//     uniqueArray.forEach(function(u){
//         elem[u] = 0;
//     });
//     for(var i = 0; i < this.length; i++){
//         if(uniqueArray.indexOf(this[i]) > -1){
//             elem[this[i]]++;
//         }
//     }
//     return elem;
// };
// var uID_freq = IDChecked.frequency();
// var ID_dup = [];
// Object.keys(uID_freq).forEach(function(i){
// 	if(uID_freq[i]>1){
// 	   ID_dup.push(i);
// 	}
// });



allCollections.indexOf('lung_pcaloadings_cbio_prcomp-oncovogel274-methylation-hm27');
IDNotChecked.findSubSetByCollectionNames(collections).map(function(s){return s.type;}).unique();
IDNotChecked.findSubSetByCollectionNames(collections).map(function(s){return s.collection;}).sort();
IDNotChecked.findSubSetByCollectionNames(collections).forEach(function(s){console.log(s.type + " : " + s.collection);});

var typesWithNoPtIDs = ['geneDegree', 'map', 'pcaLoadings', false, 'genes', 'chromosome','centromere', 'annotation'];
var diseasesWithNoPtIDs = ['lung', 'coadread'];
IDNotChecked.findSubSetByCollectionNames(collections).forEach(function(s){
	var str = s.collection.split("_")[0];
	if(!typesWithNoPtIDs.contains(s.type) || !diseasesWithNoPtIDs.contains(str)){
		console.log(s);
	}

});

/*  Manually checked below not in manifest: 
	read_rna_ucsc_hiseq
	luad_mds_ucsc_mds-allgenes-cnv-mut01-ucsc
	lgg_rna_ucsc_hiseq
	hnsc_tcga_sample_map
	hnsc_rna_ucsc_hiseq
	hnsc_rna_cbio_seq
	gbm_rna_ucsc_hiseq
	esca_edges_ucsc_tcgagbmclassifiers
	coad_rna_ucsc_hiseq
	brca_rna_ucsc_hiseq
	brca_protein_ucsc_rppa
	*/

//******************************************************************************

var uniqueTypes = patientID_errors.map(function(p){return p.type;}).unique();
var uniqueDiseases = patientID_errors.map(function(p){return p.disease;}).unique();

var status_byDbyT = [];
for(var i=0;i<uniqueDiseases.length;i++){
	for(var j=0; j<uniqueTypes.length;j++){
		var elem = {};
		var ptIDs = [];
		var arr = patientID_errors.findObjByDiseaseByType(uniqueTypes[j], uniqueDiseases[i]);
		arr.forEach(function(a){
			ptIDs = ptIDs.concat(a.ptIDStatus).unique();
		});
		elem.disease = uniqueDiseases[i];
		elem.type = uniqueTypes[j];
		elem.ptIDStatus = ptIDs;
		status_byDbyT.push(elem);
	}
}
jsonfile.writeFile("patientID_byDiseaseByType.json", status_byDbyT, {spaces:4});

var status_byDbyT = [];
jsonfile.readFile("../report/patientID_byDiseaseByType.json").then(function(res){status_byDbyT = res;});
format.inline(uniqueTypes);

for(var i=0;i<uniqueDiseases.length;i++){
	var d = status_byDbyT.findCollectionsByDisease(uniqueDiseases[i]);
	var str = "";
	for(var j=0; j<uniqueTypes.length-1;j++){
		str = str + d.findObjsByType(uniqueTypes[j]).ptIDStatus.length + " | " ;
		console.log(i, ": ", j);
	}
	str = str + d.findObjsByType(uniqueTypes[j]).ptIDStatus.length;
	format.table(str);
}

