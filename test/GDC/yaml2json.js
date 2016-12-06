YAML = require('yamljs');
 
// parse YAML string 
nativeObject = YAML.parse(yamlString);
 
// Generate YAML 
yamlString = YAML.stringify(nativeObject, 4);
 
// Load yaml file using YAML.load 
nativeObject = YAML.load('myfile.yml');
