const u = require("underscore");
const helper = require("../testingHelper.js");
const jsonfile = require('jsonfile');
var HGNC = require("./HGNC_complete.json");
var zgenes = require("./zgenes.json");
var HGNC_doc = HGNC.response.docs;
var jzSyms = HGNC_doc.map(function(m){return m.symbol.toUpperCase();});
var mzSyms = zgenes.map(function(m){return m.hugo.toUpperCase();});
var compareRes = jzSyms.arraysCompareV2(mzSyms);

//  compareRes.refItemsNotInSelf.filter(function(m){return m.split("~")[1] == 'WITHDRAWN';}).length
// 4374
// > compareRes.refItemsNotInSelf.filter(function(m){return m.split("~").length <2 ;}).length
// 47
// > compareRes.refItemsNotInSelf.length
// 4421
// > 4374+47
// 4421
compareRes.refItemsNotInSelf.filter(function(m){return m.split("~").length <2 ;}) // Add this list to HGNC_doc
[ 'APPROVED SYMBOL',
  'C17ORF96',
  'TCEB1',
  'TCEB1P2',
  'TCEB1P3',
  'TCEB1P4',
  'TCEB1P5',
  'TCEB1P6',
  'TCEB1P7',
  'TCEB1P8',
  'TCEB1P9',
  'TCEB1P10',
  'TCEB1P11',
  'TCEB1P12',
  'TCEB1P13',
  'TCEB1P14',
  'TCEB1P15',
  'TCEB1P16',
  'TCEB1P17',
  'TCEB1P18',
  'TCEB1P19',
  'TCEB1P20',
  'TCEB1P21',
  'TCEB1P22',
  'TCEB1P23',
  'TCEB1P24',
  'TCEB1P26',
  'TCEB1P27',
  'TCEB1P28',
  'TCEB1P29',
  'TCEB1P30',
  'TCEB1P31',
  'TCEB1P32',
  'TCEB1P33',
  'TCEB1P34',
  'TCEB1P35',
  'TCEB2',
  'TCEB2P1',
  'TCEB2P2',
  'TCEB2P3',
  'TCEB2P4',
  'TCEB3',
  'TCEB3-AS1',
  'TCEB3B',
  'TCEB3C',
  'TCEB3CL',
  'TCEB3CL2' ]

> zgenes[0]
{ _id: '5813dd74b425aed410d059dd',
  hugo: 'approved symbol',
  symbols: 
   [ 'approved symbol', //? HUGO symbol? 
     'previous symbols',
     'synonyms',
     'enzyme ids',
     'entrez gene id',
     'ensembl gene id',
     'refseq ids',
     'ccds ids',
     'vega id' ] }
var HGNC_fields = [];
HGNC_doc.map(function(m){return Object.keys(m);}).reduce(function(a, b){HGNC_fields = a.concat(b).unique(); return HGNC_fields;});
[ 'gene_family',
  'date_approved_reserved',
  'vega_id', // vega id @ z-genes
  'locus_group',
  'status',
  '_version_',
  'uuid',
  'merops',
  'refseq_accession', //refseq ids @ z-genes
  'locus_type',
  'gene_family_id',
  'cosmic',
  'hgnc_id',
  'rgd_id',
  'ensembl_gene_id', //ensembl gene id @ z-genes
  'entrez_id', //entrez gene id @ z-genes
  'omim_id',
  'symbol', //approved symbol @ z-genes
  'location',
  'name',
  'date_modified',
  'mgd_id',
  'ucsc_id',
  'uniprot_ids',
  'ccds_id', // ccds ids @ z-genes
  'pubmed_id',
  'location_sortable',
  'alias_symbol', // synonyms @ z-genes
  'prev_name', 
  'date_name_changed',
  'prev_symbol', // previous symbols @ z-genes
  'ena',
  'date_symbol_changed',
  'orphanet',
  'pseudogene.org',
  'alias_name',
  'lsdb',
  'enzyme_id', // synonyms @ z-genes
  'iuphar',
  'cd',
  'lncrnadb',
  'homeodb',
  'kznf_gene_catalog',
  'intermediate_filament_db',
  'bioparadigms_slc',
  'imgt',
  'mirbase',
  'mamit-trnadb',
  'horde_id',
  'snornabase' ]

var HGNC_onco = [];
var elem = {};
HGNC_doc.forEach(function(m){
    elem = {};
    elem.hugo = m.symbol;
    var arr = [];
    arr.push(m.symbol);
    if('vega_id' in m){
        arr = arr.concat(m["vega_id"]);//√
    }
    if('ensembl_gene_id' in m){
        arr = arr.concat(m['ensembl_gene_id']);
    }
    if('entrez_id' in m){
        arr = arr.concat(m['entrez_id']);
    }
    if('refseq_accession' in m){
        arr = arr.concat(m['refseq_accession']);
    }
    if('ccds_id' in m){
        arr = arr.concat(m['ccds_id']);//√
    }
    if('alias_symbol' in m){
        arr = arr.concat(m['alias_symbol']);
    }
    if('prev_symbol' in m){
        arr = arr.concat(m['prev_symbol']);
    }
    if('enzyme_id' in m){
        arr = arr.concat(m['enzyme_id']);
    }
    elem.symbols = arr;
    HGNC_onco.push(elem);
});
var zgenes_additional = compareRes.refItemsNotInSelf.filter(function(m){return m.split("~").length <2 ;});
zgenes_additional = zgenes_additional.splice(1,zgenes_additional.length-1);//remove the first element
var Hugo_onco_additional = [];
zgenes.filter(function(m){
    return zgenes_additional.indexOf(m.hugo.toUpperCase()) > -1;
}).forEach(function(n){
    var elem = {};
    elem.hugo = n.hugo.toUpperCase();
    elem.symbols = n.symbols.map(function(s){return s.toUpperCase();});
    Hugo_onco_additional.push(elem);
});

HGNC_onco = HGNC_onco.concat(Hugo_onco_additional); //Add 46 items. There are 4374 genes that have been withdrawn from HUGO listed as xxx~withdrawn. These are not included in this list.
jsonfile.writeFile("HGNC_onco.json", HGNC_onco, {spaces: 4}, function(err){ console.error(err);}); 

zgenes.filter(function(m){return m.symbols.contains('asp');}).length // 6 six records has 'asp' as their gene symbols
zgenes.filter(function(m){return m.symbols.contains('asp');})
[ { _id: '5813dd74b425aed410d059e0',
    hugo: 'a1cf',
    symbols: 
     [ 'a1cf',
       'acf',
       'asp',
       'acf64',
       'acf65',
       'apobec1cf',
       '29974',
       'ensg00000148584',
       'nm_014576',
       'ccds7241',
       'ccds7242',
       'ccds7243',
       'ccds73133',
       'otthumg00000018240' ] }]

 zgenes.filter(function(m){return m.hugo == 'ankrd6';}); // compare to HGNC_onco[1000]



