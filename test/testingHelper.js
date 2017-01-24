//testingHelper.js
var exports = module.exports = {};

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.containPartialString = function(regex){
   var arr = [];
   for(var i = 0; i< this.length; i++){
     if(this[i].match(regex) != null ){
      arr = arr.concat(this[i]);
     }
   }
   return arr;
};

Array.prototype.arraysCompare = function(ref) {
    var elem = {};
    elem.countInRef = 0;
    elem.itemsNotInRef = [];
    var self = this.unique();
    for(var i = 0; i < self.length; i++) {
        if(ref.indexOf(self[i]) > -1){
          elem.countInRef++;
        }else{
          elem.itemsNotInRef.push(self[i]);
        }
    }
    return elem;
};

Array.prototype.arraysCompareV2 = function(ref) {
    var elem = {};
    elem.overlapCount = 0;
    elem.itemsNotInRef = [];
    elem.refItemsNotInSelf = [];
    var self = this.unique();
    for(var i = 0; i < self.length; i++) {
        if(ref.indexOf(self[i]) > -1){
          elem.overlapCount++;
        }else{
          elem.itemsNotInRef.push(self[i]);
        }
    }
    for(var j = 0; j < ref.length; j++){
        if(self.indexOf(ref[j]) == -1){
          elem.refItemsNotInSelf.push(ref[j]);
        }
    }
    return elem;
};

Array.prototype.includesArray = function(arr){
    var elem = {};
    var includes = [];
    var notIncludes = [];
    for(var i=0; i<this.length; i++){
        if(arr.indexOf(this[i]) > -1){
            includes.push(this[i]);
        }else{
            notIncludes.push(this[i]);
        }
    }
    elem.includes = includes;
    elem.notIncluded = notIncludes;
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

Array.prototype.findCollectionsByType = function(v){
  var arr = [];
  if('type' in this[0]){
    for(var i = 0; i < this.length; i++) {
      if(this[i].type === v){
        arr.push(this[i].collection);
      } 
    }
  }else if('dataType' in this[0]){
    for(var i = 0; i < this.length; i++) {
      if(this[i].dataType === v){
        arr.push(this[i].collection);
      } 
    }
  }
  
  return arr.unique();
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

Array.prototype.findObjByDiseaseByType = function(t, d) {
  var arr = [];
  this.forEach(function(a){
    if(a.type==t && a.disease==d) 
      arr.push(a);
  });
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

exports.nestedUniqueCount = function(obj){
    var errorCount = {};
    var ar = [];
    var str;
    obj['errors'].forEach(function(a){
        a.errorType.forEach(function(e){
          str = e.schemaPath + " [message: "+ e.message + "]; Number of Violations: ";  
          if(ar.contains(str)){
            errorCount[str]++;
          }else{
            ar.push(str);
            errorCount[str]=1;
          }
        });
    });
    //return ar.unique();
    return errorCount;
};

exports.nestedUnique = function(obj){
    var ar = [];
    obj['errors'].forEach(function(a){
        ar.push(a['errorType']);
    });
    return ar.unique();
};

exports.format = {
  h1: function(text) { console.log(); console.log('# '+text); },
  h2: function(text) { console.log(); console.log('## '+text); },
  h3: function(text) { console.log(); console.log('### '+text); },
  h4: function(text) { console.log(); console.log('#### '+text); },
  h5: function(text) { console.log(); console.log('##### '+text); },
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

