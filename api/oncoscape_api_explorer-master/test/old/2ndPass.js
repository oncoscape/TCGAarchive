// ajvMsg object is obtained from running mongoTest.js
var jsonfile = require("jsonfile");
const CUT_OFF_VALUE = 20;
var tool_schemas = {};
var ajvMsg = [];
jsonfile.readFile("ajvMsg.json", function(err, obj) {
  ajvMsg = obj;
});
jsonfile.readFile("tool_schemas.json", function(err, obj) {
  tool_schemas = obj;
});
var indicator = [];

var ajvMsg_length = ajvMsg.length;
var tools = Object.keys(tool_schemas);
var tool_length = tools.length;

for(var i=0; i<ajvMsg_length; i++){
	 var disease_level_msg = {};
	 var msg = ajvMsg[i];
	 disease_level_msg['disease'] = msg['disease'];
	 for(var j=0; j<tool_length; j++){
	 	var required_collections = Object.keys(msg[tools[j]]);
	 	var required_collection_length = required_collections.length;
	 	var tool_level_msg = {};
	 	for(var m=0; m<required_collection_length; m++){
	 		//console.log(msg[tools[j]][required_collections[m]]);
	 		if(msg[tools[j]][required_collections[m]]['passedPercentage'] < CUT_OFF_VALUE){
	 			tool_level_msg = "fail";
	 		}else{
	 			tool_level_msg = "pass";
	 		}
	 	}
	 	disease_level_msg[tools[j]] = tool_level_msg;
	 }
	 console.log(i);
	 indicator[i] = disease_level_msg;
}	

console.dir(indicator);
jsonfile.writeFile("indicator.json", indicator, function(err){ console.error(err);});

