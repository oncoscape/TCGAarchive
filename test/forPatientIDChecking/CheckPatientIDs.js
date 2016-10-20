/* 
This is the code to check patient IDs throughout the entire database
requires: mongoose
          ptList.json
          ajv_1012_v2.json
          schema_tcga.json
Purposes
        - substratify the entire DB by datatype and 
          and run schemas.json ajv validation on each collection 
          error message at the document level will be reported
*/
var jsonfile = require("jsonfile-promised");
var asyncLoop = require('node-async-loop');
const mongoose = require("mongoose");
var ajvMsg, collection, schemas, ptList;

jsonfile.readFile("../datasourceTesting/ptList.json").then(function(obj){
  ptList = obj;
});

jsonfile.readFile("../datasourceTesting/ajv_tcga_v2_10182016.json").then(function(obj){
  ajvMsg = obj;
});

jsonfile.readFile("../schemas.json").then(function(obj){
  schemas = obj;
});

var diseases = ajvMsg.map(function(a){return a.disease;});
diseases = diseases.unique();

mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin', {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var connection = mongoose.connection;
var status = [];
connection.once('open', function(){
    var db = connection.db; 
    var index = 0;
    var ajvMsg_length = ajvMsg.length;


    /* this section is to run molecular collection type by type
     */
    var status_protein = [];
    var ajvMsg_mol = ajvMsg.findObjsByType("protein");
    asyncLoop(ajvMsg_mol, function(d, next){  
      console.log("*************", d.collection);

      // var disease_ajvMsg = ajvMsg.findCollectionsByDisease(d); 
      // var ajvMsg_length = disease_ajvMsg.length; 
      // var index = 0;
      var processNextMolCollection = function(){
        // var tableName = disease_ajvMsg[index].collection;
        // var t = disease_ajvMsg[index].type;
        var tableName = d.collection;
        var t = d.type;
        var collection = db.collection(tableName);
        var cursor = collection.find();
        var elem = d;
        elem.ptIDStatus = [];
        var count = 0;
        if(["mut", "mut01", "methylation", "rna", "protein", "cnv"].indexOf(t) > -1){
          console.log('within molecular');
          cursor.each(function(err, item){
            if(item != null){
              console.log(count++);
              var evaluation = Object.keys(item.patients).arraysCompare(ptList[d.disease]);
              //if(evaluation.itemsNotInRef.length != 0){
                  elem.ptIDStatus = elem.ptIDStatus.concat(evaluation).unique();
              //}
            }else{
              next();
            }
          });
        }
        status_protein.push(elem);
      };
      
      // Call processNextCollection recursively
      if(ptList[d.disease] != 0){
        processNextMolCollection();
      }else{
        next();
      }
    }, function (err)
    {
        if (err)
        {
            console.error('Error: ' + err.message);
            return;
        }
     
        console.log('One molecular type is Finished!');
    });
    jsonfile.writeFile("status_protein_10192016.json", status_protein, {spaces: 4}, function(err){ console.error(err);}); 

    /* This section theoretically runs throughout the entire DB, but will cause memory leak
     */
    // asyncLoop(ajvMsg, function(d, next){  
    //   console.log("*************", d.collection);

    //   // var disease_ajvMsg = ajvMsg.findCollectionsByDisease(d); 
    //   // var ajvMsg_length = disease_ajvMsg.length; 
    //   // var index = 0;
    //   var processNextMolCollection = function(){
    //     // var tableName = disease_ajvMsg[index].collection;
    //     // var t = disease_ajvMsg[index].type;
    //     var tableName = d.collection;
    //     var t = d.type;
    //     var collection = db.collection(tableName);
    //     var cursor = collection.find();
    //     var elem = d;
    //     elem.ptIDStatus = [];
    //     var count = 0;
    //     if(["mut", "mut01", "methylation", "rna", "protein", "cnv"].indexOf(t) > -1){
    //       console.log('within molecular');
    //       cursor.each(function(err, item){
    //         if(item != null){
    //           console.log(count++);
    //           var evaluation = Object.keys(item.patients).arraysCompare(ptList[d.disease]);
    //           if(evaluation.itemsNotInRef.length != 0){
    //               elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //           }
    //         }else{
    //           next();
    //         }
    //       });
    //     }
    //     status_mut.push(elem);
    //   };
      
    //   var processNextCollection = function(){
    //     // var tableName = disease_ajvMsg[index].collection;
    //     // var t = disease_ajvMsg[index].type;
    //     var tableName = d.collection;
    //     var t = d.type;
    //     var collection = db.collection(tableName);
    //     var cursor = collection.find();
    //     var elem = d;
    //     elem.ptIDStatus = [];
    //     var count = 0;
    //     if(["mut", "mut01", "methylation", "rna", "protein", "cnv"].indexOf(t) > -1){
    //       console.log('within molecular');
    //       cursor.each(function(err, item){
    //         if(item != null){
    //           console.log(count++);
    //           var evaluation = Object.keys(item.patients).arraysCompare(ptList[d.disease]);
    //           if(evaluation.itemsNotInRef.length != 0){
    //               elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //           }
    //         }else{
    //           next();
    //         }
    //       });
    //     }else
    //     if(t == "color"){
    //       console.log('within color');
    //       cursor.each(function(err, item){
    //         if(item != null){
    //           item.data.forEach(function(e){
    //             var evaluation = e.values.arraysCompare(ptList[d.disease]);
    //             console.log(evaluation);
    //             if(evaluation.itemsNotInRef.length != 0){
    //               elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //             }
    //           });
    //         }else{
    //           next();
    //         }
    //       });
    //     }
    //     else if(t == "events"){
    //       console.log("within events");
    //       cursor.each(function(err, item){
    //         if(item != null){
    //           var evaluation = Object.keys(item).arraysCompare(ptList[d.disease]);
    //           if(evaluation.itemsNotInRef.length != 0){
    //             elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //           }
    //         }else{
    //           next();
    //         }
    //       });
    //     }
    //     else if(["patient", "drug", "newTumor", "otherMalignancy", "radiation", "followUp", "newTumor-followUp"].indexOf(t) > -1){
    //       console.log("within clinical");
    //       console.log(count++);
  
    //       collection.distinct('patient_ID').then(function(ids){
    //         var evaluation = ids.arraysCompare(ptList[d.disease]);
    //         if(evaluation.itemsNotInRef.length != 0){
    //           elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //         }
    //         next();
    //       });
          
    //     }
    //     else if(["pcaScores", "mds"].indexOf(t) > -1){
    //       console.log("within pcaScores or mds");
    //       cursor.each(function(err, item){
    //         console.log(count++);
    //         if(item != null){
    //           var evaluation = Object.keys(item.data).arraysCompare(ptList[d.disease]);
    //           if(evaluation.itemsNotInRef.length != 0){
    //             elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //           }
    //         }else{
    //           next();
    //         }
    //       }); 
    //     }
    //     else if(t == "edges"){
    //       console.log("within edges");
    //       collection.distinct('p').then(function(ids){
    //         var evaluation = ids.arraysCompare(ptList[d.disease]);
    //         if(evaluation.itemsNotInRef.length != 0){
    //           elem.ptIDStatus = elem.ptIDStatus.concat(evaluation.itemsNotInRef).unique();
    //         }
    //         next();
    //       }); 
    //     }
    //     else if(t == "ptDegree"){
    //       console.log("within ptDegree");
    //       cursor.each(function(err, item){
    //         console.log(count++);
    //         if(item != null){
    //           if(ptList[d.disease].indexOf(Object.keys(item)[1]) != -1)
    //             elem.ptIDStatus.push(Object.keys(item)[1]);
    //         }else{
    //           next();
    //         }
    //       });
    //     }
    //     else{
    //       console.log("&&&& THIS TYPE IS NOT INCLUDES: ", t);
    //       index += 1;
    //       next();
    //     }
        
    //     status.push(elem);
    //   };
    //   // Call processNextCollection recursively
    //   if(ptList[d.disease] != 0){
    //     processNextCollection();
    //   }else{
    //     next();
    //   }
    // }, function (err)
    // {
    //     if (err)
    //     {
    //         console.error('Error: ' + err.message);
    //         return;
    //     }
     
    //     console.log('Finished!');
    // });

});
status.forEach(function(s){if(s.type == t) console.log(s.collection,": ", s.ptIDStatus);});

status.forEach(function(s){if(s.ptIDStatus.length !=0) console.log(s.collection,": ", s.ptIDStatus.length);});
// jsonfile.writeFile("ajv_tcga.json", ajvMsg, {spaces: 4}, function(err){ console.error(err);}); 
// mongoose.connection.close(); 
//
jsonfile.writeFile("status_woMol_10142016.json", status, {spaces: 4}, function(err){ console.error(err);}); 
jsonfile.writeFile("status_mut_10152016.json", status_mut, {spaces: 4}, function(err){ console.error(err);}); 




