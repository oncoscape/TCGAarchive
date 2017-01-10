const mongoose = require("mongoose");
const jsonfile = require("jsonfile-promised");
const asyncLoop = require('node-async-loop');
const helper = require("../testingHelper.js");
const u = require("underscore");
var lookup_datasources = require("../lookup_arr.json");

// Concatenate all the edges documents
var Edges = [];
var edges, ptDegrees, geneDegrees, tmp;
lookup_datasources.forEach(function(M){
						if("edges" in M){
							Edges = Edges.concat(M.edges);
						}
					});	
var connection = mongoose.connection;

mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE,
            socketOptions: { keepAlive: 3000000, connectTimeoutMS: 300000, socketTimeoutMS: 300000}
        },
        replset: {
            rs_name: 'rs0',
            socketOptions: { keepAlive: 3000000, connectTimeoutMS: 300000, socketTimeoutMS: 300000}
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var fetchAPIData = function(db, filename){
  return new Promise(function(resolve, reject){
  	db.collection(filename).find().toArray().then(function(response){
  		resolve(response);
  	});   
  });
};

var processEachEdgesDoc = function(db, E){
    return new Promise(function(resolve, reject){
        var edges = fetchAPIData(db, E.edges);
        var patientWeights = fetchAPIData(db, E.patientWeights);
        var geneDegrees = fetchAPIData(db, E.genesWeights);
        var elem = {};
        elem.edges = E.edges;
        elem.geneWeightsErrors = [];
        elem.ptWeightsErrors = [];
        elem.others = [];
        Promise.all([edges, patientWeights, geneDegrees]).then(function(response){
            console.log("received data from ", E.edges);
            edges_fetched = response[0];
            pt_fetched = response[1];
            gene_fetched = response[2];
            //Checking geneWeights
            pt_fetched.forEach(function(patientWeight){
                var pt = Object.keys(patientWeight)[1];
                var edges_cal = edges_fetched.filter(function(ed){return ed.p == pt}).length;
                var el = {};
                if(patientWeight[pt] != edges_cal){
                    el.ptWeightsRead = patientWeight[pt];
                    el.edgesRead = edges_cal;
                    elem.ptWeightsErrors.push(el);
                }
            });
            //Checking patientWeights
            gene_fetched.forEach(function(geneWeight){
                var gene = Object.keys(geneWeight)[1];
                var edges_cal = edges_fetched.filter(function(ed){return ed.g == gene}).length;
                var el = {};
                if(geneWeight[gene] != edges_cal){
                    el.ptWeightsRead = geneWeight[pt];
                    el.edgesRead = edges_cal;
                    elem.ptWeightsErrors.push(el);
                }
            });
            resolve(elem);
        });
    });
	
};
var RES = [];
connection.once('open', function(){
    var db = connection.db; 
    asyncLoop(Edges, function(Ed, next){
    	processEachEdgesDoc(db, Ed).then(function(response){
            RES.push(response);
            next();
        });
    }, function (err)
    {
        if (err)
        {
            console.error('Error: ' + err.message);
            return;
        }
        jsonfile.writeFile("edges_weights.json", RES, {spaces: 4}); 
        console.log('Finished!');
    	connection.close();
    });
});


