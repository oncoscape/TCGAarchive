const u = require("underscore");
const fs = require("fs");
const jsonfile = require("jsonfile-promised");
const helper = require("../testingHelper.js");
var output = require("./output.json");
var ptList = require("./ptList.json");

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





