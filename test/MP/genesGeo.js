const mongoose = require("mongoose");
const jsonfile = require("jsonfile-promised");
const asyncLoop = require('node-async-loop');
const helper = require("../testingHelper.js");
const u = require("underscore");
var lookup_datasources = require("../lookup_arr.json");
var genesets, chromosomes;
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

connection.once('open', function(){
    var db = connection.db; 
    Promise.all([fetchAPIData(db, 'hg19_genesets_orghs_1e05'), fetchAPIData(db, 'hg19_chromosome_orghs_1e05')]).then(function(response){
      genesets = response[0];
      chromosomes = response[1];
      
      //Within genesets, check the distance among all the genes within one geneset
      genesets.forEach(function(geneset){
        var data = geneset.data;
        var genes = Object.keys(geneset.data);
        var dis = [];
        var d;
        console.log("*****", geneset.name);
        for(var i=0; i<genes.length; i++){
          for(var j=i+1; j<genes.length; j++){
            d = Math.pow((data[genes[i]].x - data[genes[j]].x),2) + Math.pow((data[genes[i]].y - data[genes[j]].y),2);
            if(d == 0){
              console.log(genes[i], genes[j]);
            }
            dis.push(d);
          }
        }
      });

      //X coordinate 
      var chr_x_pos = Object.keys(chromosomes[0].data).map(function(chr){return Math.round(chromosomes[0].data[chr].x);});
      var chr_p_pos = Object.keys(chromosomes[0].data).map(function(chr){return Math.round(chromosomes[0].data[chr].p);});
      var chr_q_pos = Object.keys(chromosomes[0].data).map(function(chr){return Math.round(chromosomes[0].data[chr].q);});
      genesets.forEach(function(geneset){
        var data = geneset.data;
        var genes = Object.keys(geneset.data);
        var chr;
        console.log("*****", geneset.name);
        for(var i=0; i<genes.length; i++){
          if(chr_x_pos.indexOf(Math.round(data[genes[i]].x)) == -1){
            console.log(genes[i], " is not on chromosome.");
          }else{
            //console.log(Object.keys(chromosomes[0].data)[chr_x_pos.indexOf(Math.round(data[genes[i]].x))]);
            loc = chr_x_pos.indexOf(Math.round(data[genes[i]].x));
            if((data[genes[i]].y > chr_q_pos[loc]) || (data[genes[i]].y < chr_p_pos[loc])){
              console.log(genes[i], " y coordinate is out of boundary of chromosome ", chr_x_pos[loc]);
            }else{
              console.log(data[genes[i]].y, "[", chr_p_pos[loc], ",", chr_q_pos[loc],"]");
            }
          }
        }
      });

});

