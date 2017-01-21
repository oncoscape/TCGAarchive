const mongoose = require("mongoose");
const jsonfile = require("jsonfile-promised");
const asyncLoop = require('node-async-loop');
const helper = require("../testingHelper.js");
const u = require("underscore");
var lookup_datasources = require("../lookup_arr.json");
var manifest = require("../manifest_all.json");
var lookup_genesets = require("../lookup_genesets.json");

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


// Concatenate all the edges documents
var Edges = [];
var edges, ptDegrees, geneDegrees, tmp, cnv_fetched, mut01_fetched;
lookup_datasources.forEach(function(M){
                        if("edges" in M){
                            Edges = Edges.concat(M.edges);
                        }
                    }); 
var index = 0;
Edges.map(function(Ed){
   var _id;
   Ed.parent = [];
   console.log(index++);
   var parent = manifest.filter(function(m){return m.collection == Ed.edges;})[0].parent;
   console.dir(parent);
   if('1' in parent){
     _id = parent['1'][0]['_id'];
     Ed.parent.push(manifest.filter(function(m){return m['_id'] == _id;})[0].collection);
   }
   if('_id' in parent){
     _id = parent['_id'];
     Ed.parent.push(manifest.filter(function(m){return m['_id'] == _id;})[0].collection);
   }
   if(Array.isArray(parent) && '_id' in parent[0]){
     _id = parent[0]['_id'];
     Ed.parent.push(manifest.filter(function(m){return m['_id'] == _id;})[0].collection);
   }
   if(Array.isArray(parent) && Array.isArray(parent[0]) &&  typeof(parent[0][0]) != "undefined"){
     _id = parent[0][0]['_id'];
     Ed.parent.push(manifest.filter(function(m){return m['_id'] == _id;})[0].collection);
   }
   return Ed;
   //return manifest.filter(function(m){return m.collection == Ed.edges;})[0].parent; 
});
var parents = u.flatten(Edges.map(function(m){return m.parent;})).unique().sort();
var children = {};
parents.forEach(function(m){
    children[m] = [];
});
Edges.forEach(function(E){
    E.parent.forEach(function(m){
        children[m].push(E.edges);
    });
});
lookup_genesets.forEach(function(m){
    m.briefname = m.name.replace(/ /g, "").toLowerCase();
});
var genesInGenesets =  u.flatten(lookup_genesets.map(function(m){return m.genes;})).unique();
//var genesetNameStrings = lookup_genesets.map(function(m){return m.name.replace(/ /g, "").toLowerCase();}); 
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
            elem.cnvAltNum = edges_fetched.filter(function(m){return m.m != '0';}).length;
            elem.mutAltNum = edges_fetched.filter(function(m){return m.m == '0';}).length;
            elem.geneLen = edges_fetched.map(function(m){return m.g;}).unique().length; 
            resolve(elem);
        });
    });
	
};


var getGenesetsMol = function(db, parent, genelist){
  return new Promise(function(resolve, reject){
    db.collection(parent).find({gene:{$in: genelist}},{gene:1, patients:1}).toArray().then(function(response){
      resolve(response);
    });   
  });
};


var RES = [];
var par;
var data;
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

    asyncLoop(Object.keys(children), function(parent, next){
        console.log(parent);
        getGenesetsMol(db, parent, genesInGenesets).then(function(response){
          data = response;
          children[parent].forEach(function(ch){
             var edgesInfo = RES.filter(function(r){return r.edges == ch})[0]; 
             var gn = lookup_genesets.filter(function(m){return edgesInfo.edges.indexOf(m.briefname)!= -1;})[0]['genes'];
             var subData = data.filter(function(m){return gn.contains(m.gene);});
             if(parent.indexOf("_cnv_") > -1){
                var cnvAltParent = subData.map(function(s){return Object.keys(s['patients']).map(function(m){return s['patients'][m];}).filter(function(m){return m != 0;}).length;}).reduce(function(a,b){return b = a+b;});
                if(cnvAltParent != edgesInfo.cnvAltNum){
                    console.log("cnv alteration numbers from molecular parent is: ", cnvAltParent);
                    console.log("cnv alteration numbers from edges children is: ", edgesInfo.cnvAltNum);
                }
             }else{
                var mutAltParent = subData.map(function(s){return Object.keys(s['patients']).map(function(m){return s['patients'][m];}).filter(function(m){return m==1;}).length;}).reduce(function(a,b){return b = a+b;});
                if(mutAltParent != edgesInfo.mutAltNum){
                    console.log("mutation alteration numbers from molecular parent is: ", mutAltParent);
                    console.log("cnv alteration numbers from edges children is: ", edgesInfo.mutAltNum);
                }
             }
          });
          next();
        });
    });
});


