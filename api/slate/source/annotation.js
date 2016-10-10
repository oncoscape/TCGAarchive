var jsonfile = require("jsonfile");
var cbio_annotation = {};
var ucsc_annotation = {};

jsonfile.readFile("cbio_mol_annotation.json", function(err, obj) {
  cbio_annotation = obj;
});

jsonfile.readFile("ucsc_mol_annotation.json", function(err, obj) {
  ucsc_annotation = obj;
});

