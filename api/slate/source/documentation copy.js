var connectionString = 'mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017/os';
var comongo = require('co-mongodb');
var co = require('co');
//var db = "os";
const _ = require('underscore');

 

var format = {
h1: function(text) { console.log(); console.log('# '+text); },
h2: function(text) { console.log(); console.log('## '+text); },
text: function(text){ console.log(text); },
codeStart: function() { console.log(); console.log('```'); },
codeStop: function() { console.log(); console.log('```'); },
code: function(text) { console.log(text) }
};





var onerror = function(e){
console.log(e);
}

co(function *() {

	console.log("beginning");
	// Connect To Mongo
	// db = yield comongo.get();
	//comongo.db.authenticate('oncoscapeRead','i1f4d9botHD4xnZ');
	db = yield comongo.client.connect(connectionString);
	// //comongo.admin.authenticate({usernames:'oncoscapeRead', password:'i1f4d9botHD4xnZ'});
	console.log("test1");
	// // Select A Collection In DB (Database)
	// collection = yield comongo.db.collection(db, "clinical_tcga_gbm_pt");

	// // Get All Documents
	// var documents  = yield collection.find({}).toArray();

	// console.log(documents);
	// documents.forEach(function(doc){
	// format.h1(doc.name);
	// format.h2(doc.disease);
	// Object.keys(doc.collections).forEach(function(key){
	// var value = this.collections[key];
	// format.codeStart();
	// format.code("http://oncoscape.sttrcancer.io/api/"+value);
	// format.codeStop();


	// //var fields  = yield collection.find({}).toArray();



	// }, {collections:doc.collections});
	// })


    yield comongo.db.close(db);
});
//.catch(onerror);

