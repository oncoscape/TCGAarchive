const helper = require("../testingHelper.js");
const jsonfile = require("jsonfile");
var lookup = require("../lookup_arr.json");

lookup.forEach(function(l){
	l.tool = {};
	if('clinical' in l && 'events' in l.clinical){
		l.tool.timeline = true;
	}else{
		l.tool.timeline = false;
	}
});
jsonfile.writeFile("lookup.json", lookup,  {spaces: 4}, function(err){ console.error(err);}); 
