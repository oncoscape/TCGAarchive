var jsonfile = require("jsonfile");
var lookup_elem = {};
var manifest_elem = {};
var format = {
	h1: function(text) { console.log(); console.log('# '+text); },
	h2: function(text) { console.log(); console.log('## '+text); },
	h3: function(text) { console.log(); console.log('### '+text); },
	h4: function(text) { console.log(); console.log('#### '+text); },
	textbold: function(text) { console.log(); console.log(); console.log('**'+ text+'**'); },
	textlist: function(text){ console.log(); console.log('- '+ text);  },
	textsublist: function(text){ console.log('  * '+ text);  },
	text: function(text){ console.log(); console.log(text);  },
	url: function(text) {console.log(); console.log('`' + text + '`'); console.log();},
	codeStart: function() { console.log(); console.log('```'); },
	codeComment: function(text) {console.log(); console.log('> ' + text); console.log(); },
	codeStop: function() {console.log('```');  console.log(); },
	code: function(text) { console.log('"'+ text + '"'); },
	jsonfy: function(text) { console.log('{' + text + '}');},
	codeRStart: function(text) {  console.log(); console.log("```r");},
	codeMongoStart: function(text) {  console.log(); console.log("```shell"); },
	codeJSStart: function(text) {  console.log(); console.log("```javascript"); },
	codePyStart: function(text) {  console.log(); console.log("```python"); },
	codeJSONStart: function(text) {  console.log(); console.log("```json"); },
	table: function(text){ console.log(text);  }
};

var lookup_keys_annot = {
	'disease':'disease code used in Oncoscape naming system',
  	'source':'data source',
	'beta':'For a specific dataset, if the beta value is true, this dataset is currently only alive in the developmental environment and won\'t be included in the production version of Oncoscape application.',
	'name':'disease name',
	'img':'images utilized for Oncoscape application',
	'clinical':'clinic-related collections',
	'category':'geneset and coloring collections utilized by Oncoscape application',
	'molecular':'molecular collections',
	'calculated':'derived colletions for PCA (one of the Oncoscape tools) and Multidimensional scaling',
	'edges':'derived colecitons for Markers and Patient (one of the Oncoscape tools)',
	'type': 'all possible data type for each collection'
};
var lookup_clinical_keys_annot = {
	'events':'clinical events collection organized by patient',
	'patient':'patient collection for each disease type',
	'drug':'chemo or other medicine administration records',
	'newTumor':'new tumor event records for possible patients',
	'otherMalignancy':'other maliganancy records for possible patients',
	'radiation':'radiation administration records',
	'followUp':'possible follow-up records',
	'newTumor-followUp':'possible follow-up records for the new tumor events'
}

var manifest_keys_annot = {
	'dataset':'disease code used in Oncoscape naming system',
	'dataType':'all possible data type for each collection',
	'date':'processed date',
	'source':'data source',
	'process':'process that used to derive this collection',
	'processName':'name of the process that used to derive this collection',
	'parent':'the collection(s) used to derive this collection' 
};

var type_keys_annot = {
	'color':'a collection for coloring in Oncoscape application',
	'mut':'non-synonymous mutations representated as strings in this collection',
	'mut01':'non-synonymous mutations representated as binary values in this collection',
	'events':'clinical events collection organized by patient',
	'patient':'patient collection for each disease type',
	'drug':'chemo or other medicine administration records',
	'newTumor':'new tumor event records for possible patients',
	'otherMalignancy':'other maliganancy records for possible patients',
	'radiation':'radiation administration records',
	'followUp':'possible follow-up records',
	'newTumor-followUp':'possible follow-up records for the new tumor events',
	'genesets':'a collection of multiple genesets with specific genes in each set',
	'methylation':'DNA methlyation data',
	'rna':'mRNA and microRNA expression data',
	'protein':'protein-level and phosphoprotein level (RPPA) data',
	'psi':'percentage spliced in (PSI, Ψ) values in RNA splicing data',
	'facs':'Fluorescence-activated cell sorting data',
	'cnv':'DNA copy-number data represented as Gistic score',
	'annotation':'annotation files for a specific data type, for instance RNA splicing',
	'chromosome':'annoataion for chromosomes',
	'genes':'annotation data used to annotate genes',
	'centromere':'centromere position for each chromosome on human genome',
	'pcaScores':'calculated PCA scores for a specific data with specific genesets',
	'pcaLoadings':'pre-calculated PCA scores for a specific data with specific genesets',
	'mds':'Multidimensional Scaling data for a specific data with specific genesets',
	'edges':'derived collection to describe edges between genes and patients use for Markers and Patients (one of the Oncoscape tools)',
	'ptDegree':'derived collection to describe the weight of patients based on on the number of data points use for Markers and Patients (one of the Oncoscape tools)',
	'geneDegree':'derived collection to describe the weight of genes based on on the number of data points use for Markers and Patients (one of the Oncoscape tools)' 
};

var source_keys_annot = {
	'tcga':'<a href=\'https://gdc.cancer.gov/\'>TCGA</a>',
	'broad':'<a href=\'https://gdac.broadinstitute.org//\'>Broad Firehose</a>',
	'hgnc':'<a href=\'http://www.genenames.org/\'>HUGO Gene Nomenclature Committee</a>',
	'cBio':'<a href=\'http://www.cbioportal.org/\'>cBioPortal</a>',
	'bradleyLab':'<a href=\'www.fredhutch.org/en/labs/labs-import/bradley-lab.html/\'>Bradley Lab</a>',
	'demo':'<a href=\'oncoscape.sttrcancer.org/\'>Demo data source</a>',
	'ucsc-PNAS':'<a href=\'http://www.pnas.org/content/113/19/5394.full/\'>Publication</a>',
	'ucsc':'<a href=\'https://genome-cancer.ucsc.edu/\'>UCSC</a>',
	'orgHs':'<a href=\'https://bioconductor.org/packages/release/data/annotation/html/org.Hs.eg.db.html/\'>Genome wide annotation for Human</a>'
};

jsonfile.readFile("lookup_elem.json", function(err, obj) {
  	lookup_elem = obj;
});
jsonfile.readFile("manifest_elem.json", function(err, obj) {
	manifest_elem = obj;
});



jsonfile.readFile("lookup_elem.json", function(err, obj) {
  	lookup_elem = obj;
  	format.h2("From Disease Perspective");
	format.text("Key words to describe lookup_oncoscape_datasource collection");
	format.text("Key | Annotation");
	format.table("--------- | ----------- ");
	var lookup_keys_annot_keys = Object.keys(lookup_keys_annot); 
    for(var i=0;i<lookup_keys_annot_keys.length;i++){
    	format.table(lookup_keys_annot_keys[i] + " | " + lookup_keys_annot[lookup_keys_annot_keys[i]]);
    }    

	format.h3("Disease List");
	var disease_length = lookup_elem.disease.length;
	format.text("Disease Code | Disease Name");
    format.table("--------- | ----------- "); 
    for(var j=0;j<disease_length;j++){
    	format.table(lookup_elem.disease[j] + " | " + lookup_elem.name[j])
    } 

    format.h3("source");
    // lookup_elem.source.forEach(function(e){
    // 	if(e != ''){
    // 		format.text(e);
    // 	}
    // });
    format.text("<a href='https://gdc.cancer.gov/'>TCGA</a>");

    format.h3("clinical");
    format.text("Key words to describe clinical collections for each disease type");
	format.text("clinical collection type | Annotation");
	format.table("--------- | ----------- ");
	var lookup_clinical_keys_annot_keys = Object.keys(lookup_clinical_keys_annot); 
    for(var m=0;m<lookup_clinical_keys_annot_keys.length;m++){
    	format.table(lookup_clinical_keys_annot_keys[m] + " | " + type_keys_annot[lookup_clinical_keys_annot_keys[m]]);
    }  

    format.h3("molecular");
  	var lookup_molecular_source_keys = lookup_elem.molecular.source;
  	format.text("molecular collection source | Annotation");
	format.table("--------- | ----------- ");
  	for(var n=0;n<lookup_molecular_source_keys.length;n++){
    	format.table(lookup_molecular_source_keys[n] + " | " + source_keys_annot[lookup_molecular_source_keys[n]]);
    } 
  	var lookup_molecular_type_keys = lookup_elem.molecular.type;
  	format.text("molecular collection type | Annotation");
	format.table("--------- | ----------- ");
  	for(p=0;p<lookup_molecular_type_keys.length;p++){
    	format.table(lookup_molecular_type_keys[p] + " | " + type_keys_annot[lookup_molecular_type_keys[p]]);
    } 


    format.h3("category");
    var lookup_category_source_keys = lookup_elem.category.source;
  	format.text("category collection source | Annotation");
	format.table("--------- | ----------- ");
  	for(n=0;n<lookup_category_source_keys.length;n++){
    	format.table(lookup_category_source_keys[n] + " | " + source_keys_annot[lookup_category_source_keys[n]]);
    } 
  	var lookup_category_type_keys = lookup_elem.category.type;
  	format.text("category collection type | Annotation");
	format.table("--------- | ----------- ");
  	for(p=0;p<lookup_category_type_keys.length;p++){
    	format.table(lookup_category_type_keys[p] + " | " + type_keys_annot[lookup_category_type_keys[p]]);
    } 

    format.h3("calculated");
    var lookup_calculated_source_keys = lookup_elem.calculated.source;
  	format.text("calculated collection source | Annotation");
	format.table("--------- | ----------- ");
  	for(n=0;n<lookup_calculated_source_keys.length;n++){
    	format.table(lookup_calculated_source_keys[n] + " | " + source_keys_annot[lookup_calculated_source_keys[n]]);
    } 
  	var lookup_calculated_type_keys = lookup_elem.calculated.type;
  	format.text("calculated collection type | Annotation");
	format.table("--------- | ----------- ");
  	for(p=0;p<lookup_calculated_type_keys.length;p++){
    	format.table(lookup_calculated_type_keys[p] + " | " + type_keys_annot[lookup_calculated_type_keys[p]]);
    } 


    format.h3("edges");
    format.text("edges names are collections of genesets: ");
    format.text("edges geneset | geneset information");
	format.table("--------- | ----------- ");
	var i=0;
    lookup_elem.edges.name.forEach(function(e){
    	format.table(e + " | " + "hg19_genesets_hgnc_import[" + i  + "]");
    	i++;
    });
    var lookup_edges_source_keys = lookup_elem.edges.source;
  	format.text("edges collection source | Annotation");
	format.table("--------- | ----------- ");
  	for(n=0;n<lookup_edges_source_keys.length;n++){
    	format.table(lookup_edges_source_keys[n] + " | " + source_keys_annot[lookup_edges_source_keys[n]]);
    } 
});

jsonfile.readFile("manifest_elem.json", function(err, obj) {
	manifest_elem = obj;
	format.h2("From Collection Perspective");
	format.text("Key words to describe manifest collection");
	format.text("Key | Annotation");
	format.table("--------- | ----------- ");
	var manifest_keys_annot_keys = Object.keys(manifest_keys_annot); 
    for(var i=0;i<manifest_keys_annot_keys.length;i++){
    	format.table(manifest_keys_annot_keys[i] + " | " + manifest_keys_annot[manifest_keys_annot_keys[i]]);
    }   

	format.h3("Manifest Dataset");
	format.text("This field is identical to lookup_oncoscape_datasource's disease field.");
	var manifest_keys_annot_keys = manifest_elem.dataset;
	format.text("Disease Code | Disease Name");
    format.table("--------- | ----------- "); 
	manifest_keys_annot_keys.forEach(function(m){
		format.table(m + " | " + lookup_elem.name[lookup_elem.disease.indexOf(m.toLowerCase())]);
	});

	format.h3("All the datatypes within Database");
	var manifest_type_keys = manifest_elem.dataType;
  	format.text("collection type | Annotation");
	format.table("--------- | ----------- ");
  	for(p=0;p<manifest_type_keys.length;p++){
    	format.table(manifest_type_keys[p] + " | " + type_keys_annot[manifest_type_keys[p]]);
    } 
    
});


format.h1("Database Description");
format.text("We use two collections to track the metadata for all the data collections within our database. 'manifest' is organized by collection. 'lookup_oncoscape_datasource' is organized by disease.");




