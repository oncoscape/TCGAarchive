var u = require("underscore");
var fs = require("fs");
var jsonfile = require("jsonfile-promised");
var output = require("./output.json");
var ptList = require("./ptList.json");

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

// Create FileStream
var filestream = function(fs){
  return new Promise(function(resolve, reject){
  var stream = fs.createWriteStream("./output2.json",{  
        flags: 'w',
        defaultEncoding: 'utf8'
      });
      stream.on("open",function(){
        resolve(stream);
      });
  });
};

var output_diseases = output.map(function(m){return m.disease}).unique();
var ptList_diseases = Object.keys(ptList);
u.difference(output_diseases, ptList_diseases);
//[ 'coadread', 'lung', 'hg19' ]
ptList.lung = ptList.lusc.concat(ptList.luad);
ptList.coadread = ptList.coad.concat(ptList.read);

var result =[];
var elem = {};

output.forEach(function(o){
		elem.collection = o.collection;
		elem.disease = o.disease;
		elem.type = o.type;
		elem.IDstatus = {};
		if('IDs' in o){
			elem.IDstatus
			elem.IDstatus = o.IDs.arraysCompareV2(ptList[o.disease]);
		}
		console.log(JSON.stringify(elem, null, 4));
	});





