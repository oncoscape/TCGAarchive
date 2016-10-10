---
title: API Reference

language_tabs:
  - shell: mongo
  - R
  - python
  - javascript

toc_footers:
  - email to contact@oncoscape.org
  - <a href='https://github.com/FredHutch/Oncoscape'>Oncoscape Github Site</a>

includes:
  - errors

search: true
---

# Introduction

[Oncoscape](https://oncoscape.sttrcancer.org/#/) is a web application that hosts an integrated suite of analysis tools for users to explore hypotheses related to molecular and clinical data in order to better understand cancer biology and treatment options. Oncoscape is as an SPA -- a single page web application -- using JavaScript in the browser and R (primarily) on the backend server for statistical calculations. For more detailed information, please read [wiki](https://github.com/FredHutch/Oncoscape).

# Authentication

Oncoscape API authentication occurs at Mongo DB level. 

# Rest API Queries

## Database Connection

```shell
cd <mongodb installation dir>
./bin/mongo
db
use oncoscape
db.getCollection("clinical_tcga_gbm_pt")

```

```R
install.packages("rmongodb")
library(devtools)
install_github(repo = "mongosoup/rmongodb")
library(rmongodb)
help("mongo.create")
mongo <- mongo.create()
```

```python
import pymongo
mongod
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
db = client.oncoscape
```

```javascript
// Retrieve
var MongoClient = require('mongodb').MongoClient;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/oncoscape", function(err, db) {
  if(err) { return console.dir(err); }

  db.collection('test', function(err, collection) {});

  db.collection('test', {w:1}, function(err, collection) {});

  db.createCollection('test', function(err, collection) {});

  db.createCollection('test', {w:1}, function(err, collection) {});

});
```

### HTTP Request

`GET http://example.com/api/kittens`

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
include_cats | false | If set to true, the result will also include cats.
available | true | If set to false, the result will include kittens that have already been adopted.

<aside class="success">
Now you are connected to Oncoscape Mongo Database through Restful API
</aside>

## Disease Types



`https://tcga-data.nci.nih.gov/docs/publications/tcga/`

Disease | Code
------------ | -----------
Acute Myeloid Leukemia |LAML    
Adrenocortical carcinoma |ACC
Bladder Urothelial Carcinoma |BLCA  
Brain Lower Grade Glioma |LGG   
Breast invasive carcinoma |BRCA
Cervical squamous cell carcinoma and endocervical adenocarcinoma |CESC  
Cholangiocarcinoma |CHOL
Colon adenocarcinoma |COAD  
Esophageal carcinoma |ESCA  
Glioblastoma multiforme |GBM    
Head and Neck squamous cell carcinoma |HNSC 
Kidney Chromophobe |KICH
Kidney renal clear cell carcinoma |KIRC 
Kidney renal papillary cell carcinoma |KIRP 
Liver hepatocellular carcinoma |LIHC    
Lung adenocarcinoma |LUAD   
Lung squamous cell carcinoma |LUSC  
Lymphoid Neoplasm Diffuse Large B-cell Lymphoma |DLBC
Mesothelioma |MESO
Ovarian serous cystadenocarcinoma |OV   
Pancreatic adenocarcinoma |PAAD 
Pheochromocytoma and Paraganglioma |PCPG    
Prostate adenocarcinoma |PRAD   
Rectum adenocarcinoma |READ 
Sarcoma |SARC   
Skin Cutaneous Melanoma |SKCM   
Stomach adenocarcinoma |STAD    
Testicular Germ Cell Tumors |TGCT   
Thymoma |THYM   
Thyroid carcinoma |THCA 
Uterine Carcinosarcoma |UCS
Uterine Corpus Endometrial Carcinoma |UCEC  
Uveal Melanoma |UVM

```shell
db.getCollection('lookup_oncoscape_datasources').find({})
```

#### Source 

[TCGA Data source](https://tcga-data.nci.nih.gov/docs/publications/tcga/datatype.html)

## What kind of Data are included in each Disease Type?

```R
> library(TCGAgbm)
> dz <- TCGAgbm()
> str(dz, max.level=2)
Formal class 'TCGAgbmClass' [package "TCGAgbm"] with 8 slots
  ..@ name                 : chr "TCGAgbm"
  ..@ matrices             :List of 5
  ..@ data.frames          :List of 3
  ..@ history              :Formal class 'PatientHistoryClass' [package "PatientHistory"] with 4 slots
  ..@ manifest             :'data.frame':   14 obs. of  11 variables:
  ..@ genesets             :List of 2
  ..@ networks             :List of 2
  ..@ sampleCategorizations:List of 2
> str(dz, max.level=3)
Formal class 'TCGAgbmClass' [package "TCGAgbm"] with 8 slots
  ..@ name                 : chr "TCGAgbm"
  ..@ matrices             :List of 5
  .. ..$ mtx.cn          : int [1:563, 1:23575] 1 0 0 0 0 0 0 0 -1 0 ...
  .. .. ..- attr(*, "dimnames")=List of 2
  .. ..$ mtx.mrna        : num [1:154, 1:20457] -0.744 -1.227 -0.552 2.018 -0.346 ...
  .. .. ..- attr(*, "dimnames")=List of 2
  .. ..$ mtx.mrna.ueArray: num [1:323, 1:11864] 0.0483 0.3241 0.7026 0.4747 0.1776 ...
  .. .. ..- attr(*, "dimnames")=List of 2
  .. ..$ mtx.mut         : chr [1:291, 1:6698] "P436L" "" "" "" ...
  .. .. ..- attr(*, "dimnames")=List of 2
  .. ..$ mtx.prot        : num [1:214, 1:171] -0.5639 -0.0449 1.5614 0.0118 5.8114 ...
  .. .. ..- attr(*, "dimnames")=List of 2
  ..@ data.frames          :List of 3
  .. ..$ : NULL
  .. ..$ : NULL
  .. ..$ : NULL
  ..@ history              :Formal class 'PatientHistoryClass' [package "PatientHistory"] with 4 slots
  ..@ manifest             :'data.frame':   14 obs. of  11 variables:
  .. ..$ variable     : chr [1:14] "mtx.cn" "history" "ptList" "catList" ...
  .. ..$ class        : chr [1:14] "matrix" "list" "list" "list" ...
  .. ..$ category     : chr [1:14] "copy number" "history" "history" "history" ...
  .. ..$ subcategory  : chr [1:14] "gistic scores" "clinical" "clinical patients" "clinical categories" ...
  .. ..$ entity.count : int [1:14] 563 7644 592 12 592 154 323 291 214 1443 ...
  .. ..$ feature.count: int [1:14] 23575 NA NA NA 427 20457 11864 6698 171 2953 ...
  .. ..$ entity.type  : chr [1:14] "patient" NA NA NA ...
  .. ..$ feature.type : chr [1:14] "gene" NA NA NA ...
  .. ..$ minValue     : num [1:14] -2 NA NA NA NA ...
  .. ..$ maxValue     : num [1:14] 2 NA NA NA NA ...
  .. ..$ provenance   : chr [1:14] "tcga cBio" "tcga" "tcga" "tcga" ...
  ..@ genesets             :List of 2
  .. ..$ tcga.GBM.classifiers: chr [1:840] "ABAT" "ABCD2" "ABL1" "ACPP" ...
  .. ..$ marker.genes.545    : chr [1:545] "ABCG2" "AHNAK2" "AKT1" "ARHGAP26" ...
  ..@ networks             :List of 2
  .. ..$ g.markers.json    : chr "{\"elements\":{\"nodes\":[{\"data\":{\"name\":\"TCGA.02.0003\",\"nodeType\":\"patient\",\"subType\":\"unassigned\",\"id\":\"TCG"| __truncated__
  .. ..$ g.gbmPathways.json: chr "{\"elements\":{\"nodes\":[{\"data\":{\"name\":\"ABCA1\",\"nodeType\":\"gene\",\"label\":\"ABCA1\",\"id\":\"ABCA1\"},\"position\"| __truncated__
  ..@ sampleCategorizations:List of 2
  .. ..$ tbl.verhaakPlus1:'data.frame': 548 obs. of  2 variables:
  .. ..$ tbl.glioma8     :'data.frame': 704 obs. of  2 variables:

```

variable | class | category | subcategory | entity.count | feature.count | entity.type | feature.type | minValue | maxValue | provenance
-------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | --------- | -----
mtx.cn.RData | mtx.cn | matrix | copy number | gistic scores | 563 | 23575 | patient | gene | -2 | 2 | tcga cBio
events.RData | history | list | history | clinical | 7644 | NA | NA | NA | NA | NA | tcga
ptHistory.RData | ptList | list | history | clinical patients | 592 | NA | NA | NA | NA | NA | tcga
historyTypes.RData | catList | list | history | clinical categories | 12 | NA | NA | NA | NA | NA | tcga
tbl.ptHistory.RData | tbl.ptHistory | data.frame | history | clinical table | 592 | 427 | patients | events | NA | NA | tcga
mtx.mrna.RData | mtx.mrna | matrix | mRNA expression | Z scores | 154 | 20457 | patient | gene | -5.6790 | 3359.2622 | tcga cBio
mtx.mrna.ueArray.RData | mtx.mrna.ueArray | matrix | mRNA expression | Z scores | 323 | 11864 | patient | gene | -8.90925 | 15.54740 | tcga cBio
mtx.mut.RData | mtx.mut | matrix | mutations | aa substitutions | 291 | 6698 | patient | gene | NA | NA | tcga cBio
mtx.prot.RData | mtx.prot | matrix | protein abundance | Z scores | 214 | 171 | patient | protein | -5.62437 | 10.30523 | tcga cBio
markers.json.RData | g.markers.json | character | network | markers & samples | 1443 | 2953 | nodes | edges | NA | NA | TCGA
genesets.RData | genesets | list | geneset | NA | 2 | NA | gene | NA | NA | NA | marker.genes.545, tcga.GBM.classifiers
gbmPathways.json.RData | g.gbmPathways.json | character | network | GBM-related Pathways | 156 | 203 | nodes | edges | NA | NA | manual curation by Hamid Bolouri
verhaakGbmClustersAugmented.RData | tbl.verhaakPlus1 | data.frame | categorized samples | tumors | 548 | 2 | patient | cluster & color | NA | NA | 5 clusters; Verhaak 2010 + G-CIMP
ericsEightGliomaClusters.RData | tbl.glioma8 | data.frame | categorized samples | tumors | 704 | 2 | patient | cluster & color | NA | NA | 8 clusters; manual curation by Eric Holland



## Sanitized Clinical Collections for Each Disease Type 

Disease | Collection_Type | Collection_Name
--------- | ------- | -----------
gbm|drug | clinical_tcga_acc_drug
gbm|f1 | clinical_tcga_acc_f1
gbm|nte | clinical_tcga_acc_nte
gbm|nte_f1 | clinical_tcga_acc_nte_f1
gbm|omf | clinical_tcga_acc_omf
gbm|pt | clinical_tcga_acc_pt
gbm|rad | clinical_tcga_acc_rad

`localhost:80/api/lookup_oncoscape_datasources`

> The above command returns JSON structured like this:

```json
{
    "_id" : ObjectId("5776eeea171709ceb0555fc6"),
    "disease" : "acc",
    "collections" : {
        "drug" : "clinical_tcga_acc_drug",
        "f1" : "clinical_tcga_acc_f1",
        "nte" : "clinical_tcga_acc_nte",
        "nte_f1" : "clinical_tcga_acc_nte_f1",
        "omf" : "clinical_tcga_acc_omf",
        "pt" : "clinical_tcga_acc_pt",
        "rad" : "clinical_tcga_acc_rad"
    }
}
{
    "_id" : ObjectId("5776eeea171709ceb0555fc7"),
    "disease" : "blca",
    "collections" : {
        "drug" : "clinical_tcga_blca_drug",
        "f1" : "clinical_tcga_blca_f1",
        "f2" : "clinical_tcga_blca_f2",
        "nte" : "clinical_tcga_blca_nte",
        "nte_f1" : "clinical_tcga_blca_nte_f1",
        "omf" : "clinical_tcga_blca_omf",
        "pt" : "clinical_tcga_blca_pt",
        "rad" : "clinical_tcga_blca_rad"
    }
}
```


## How to query? 

![Oncoscape_API_explorer](/images/oncoscape_explore_home.png)

### HTTP Request:

`http://localhost:80/api/clinical_tcga_gbm_drug/?q={"$fields":["gender:Male","race:Asian"]}`

### count: 

`localhost:80/api/clinical_tcga_gbm_pt?count`

### $field

`http://localhost:80/api/clinical_tcga_gbm_drug/?q={"$fields":["patient_ID","race","gender"]}`

### $limit

`http://localhost:80/api/clinical_tcga_gbm_drug/?q={"$limit":10}`

### $skip

`http://localhost:80/api/clinical_tcga_gbm_drug/?q={"$skip":20}`

### combined query example

`http://localhost:80/api/clinical_tcga_gbm_drug/?q={"gender":"Male", "race":"Asian","$fields":["patient_ID","race","gender"],"$limit":10,"$skip":20}`


# Clinical Data

## Common Clinical Collections in each disease type

Parameter | Description
--------- | -----------
clinical_tcga_gbm_pt | collection of TCGA Glioblastoma (GBM) patients 
clinical_tcga_gbm_drug | collection of chemo drug administered on each patient
clinical_tcga_gbm_rad | collection of radiation administered on each patient
clinical_tcga_gbm_omf | other malignant form 
clinical_tcga_gbm_nte | new tumor event
tcg_gbm_f1 | the first follow up table
tcg_gbm_nte_f1 | new tumor events follow up table

### TCGA sample barcode system
<p align="center">
    <a href="https://wiki.nci.nih.gov/display/TCGA/TCGA+barcode"><img src="/images/tcga_barcode.png" alt="tcga barcode"></a>
</p>


# Molecular Data

Molecular Data sources include: cBioPortal MySQL database, other public datasets as well as private datasets. At current stage, we have JSON formatted molecular data including DNA Copy Number Variation (CNV), DNA mutation (Mut), DNA methylation (methylation), RNA expression data (mrna) and protein-level and phosphoprotein (RPPA) data. 

The current TCGA datasets are provided from [cbioportal](http://www.cbioportal.org/faq.jsp) via [Broad Firehose](http://gdac.broadinstitute.org/). 

```R
names(matrices(dz))
[1] SttrDataPackage ctor, networks.found: 2
> names(matrices(dz))
[1] "mtx.cn"  "mtx.mrna" "mtx.mrna.ueArray" "mtx.mut" "mtx.prot"         
```

## Copy Number Variation

Copy Number Variation are represented with [Gistic score](ftp://ftp.broadinstitute.org/pub/genepattern/modules_public_server_doc/GISTIC2.pdf). 

```R
> cn = matrices(dz)$mtx.cn
> dim(cn)
[1]   563 23575
> cn[c(1:10), c("EGFR", "PDGFRA", "PDGFRB", "PDGFD", "IDH1", "PTEN")]
                EGFR PDGFRA PDGFRB PDGFD IDH1 PTEN
TCGA.02.0001.01    1      0      0    -1    1    0
TCGA.02.0003.01    2      0      0     0    0   -1
TCGA.02.0006.01    1      0      0     0    0   -2
TCGA.02.0007.01    1      0      0     0    0   -1
TCGA.02.0009.01    2      0      0     0    0   -1
TCGA.02.0010.01    0      0     -1    -1    0   -1
TCGA.02.0011.01    0      0     -1     0    0   -1
TCGA.02.0014.01    0      2      0    -1    0   -1
TCGA.02.0015.01    1      0      0     0    0   -1
TCGA.02.0016.01    2      0      0     0    0   -1
```

## Mutation Data

According to our data source [cBioportal](http://www.cbioportal.org/faq.jsp#what-are-oncoprints), "We store mutation data for published cancer studies. We do not, however store mutation data for provisional cancer data sets generated by TCGA. This is because provisional studies contain preliminary somatic mutations, which per NCI guidelines cannot be redistributed until they have been validated. As each cancer study is published and finalized by the TCGA, we will import the corresponding mutation data."

```R
> dim(mut)
[1]  291 6698
> mut[c(200:210), c("EGFR", "PDGFRA", "PDGFRB", "PDGFD", "IDH1", "PTEN")]
                EGFR    PDGFRA PDGFRB PDGFD IDH1    PTEN    
TCGA.32.4211.01 ""      ""     ""     ""    ""      ""      
TCGA.76.4927.01 "R222C" ""     ""     ""    ""      "R130fs"
TCGA.06.0939.01 ""      ""     ""     ""    ""      "R233*" 
TCGA.76.4926.01 "R222C" ""     ""     ""    ""      ""      
TCGA.15.1444.01 ""      ""     ""     ""    "R132G" ""      
TCGA.27.1837.01 ""      ""     ""     ""    ""      "T277I" 
TCGA.26.5136.01 ""      ""     ""     ""    ""      ""      
TCGA.06.6693.01 ""      ""     ""     ""    ""      ""      
TCGA.06.0882.01 ""      ""     ""     ""    ""      "R173H" 
TCGA.06.0155.01 "H304Y" ""     ""     ""    ""      "C136R" 
TCGA.27.1836.01 ""      ""     ""     ""    ""      ""      
```

## Methylation Data

## Expression Data

```R
> mrna <- matrices(dz)$mtx.mrna
> dim(mrna)
[1]   154 20457
> mrna[c(1:10), c("EGFR", "PDGFRA", "PDGFRB", "PDGFD", "IDH1", "PTEN")]
                   EGFR  PDGFRA  PDGFRB   PDGFD    IDH1    PTEN
TCGA.02.0047.01 -0.5197  2.0035  1.1146  0.0166 -0.6861  0.4649
TCGA.02.0055.01 -0.6427  1.1642  0.3834  0.2029 -0.2181  0.2477
TCGA.02.2483.01 -0.6480  3.6678  0.6497 -0.3383  0.2568  0.3887
TCGA.02.2485.01 14.8733 10.8608  0.0517  1.6860 -0.7468 -0.5886
TCGA.02.2486.01  1.9919 -1.0006 -1.0431 -0.5996 -0.2788 -0.8236
TCGA.06.0125.01 19.4827  0.8435  0.4206  0.2626  1.3471 -0.9411
TCGA.06.0129.01  3.2558  3.8987 -0.8038 -0.6874 -0.1759 -0.1096
TCGA.06.0130.01 -0.5860  1.3006  1.3127  0.1338 -0.3734  0.2267
TCGA.06.0132.01  3.3013 -0.5902 -0.6581 -0.5305  0.0071 -0.3471
TCGA.06.0138.01  0.0538 -0.7941 -0.3264 -0.2727 -0.6714 -0.8844

> mrna_ueArray <- matrices(dz)$mtx.mrna.ueArray
> dim(mrna_ueArray)
[1]   323 11864
> mrna_ueArray[c(1:10), c("EGFR", "PDGFRA", "PDGFRB", "PDGFD", "IDH1", "PTEN")]
                    EGFR   PDGFRA   PDGFRB    PDGFD     IDH1     PTEN
TCGA.02.0001.01 -0.55506 -1.42016 -0.84432  0.35039  0.66024  0.19538
TCGA.02.0003.01  1.16408  0.71728 -0.97898  0.24541  0.14273  0.00998
TCGA.02.0006.01 -0.42073 -0.76334 -0.55323  1.56054 -0.33884 -1.42227
TCGA.02.0007.01 -0.14858 -0.63001 -1.22194 -1.31923 -0.57342 -0.37273
TCGA.02.0009.01  1.61760  0.04357  0.39104  0.47292  1.21465 -0.12257
TCGA.02.0010.01 -1.26082  1.54538 -0.77360  0.44092 -0.09955 -1.04246
TCGA.02.0011.01 -0.42477  1.39795  0.20248 -1.37690  0.25609  0.11981
TCGA.02.0014.01 -1.07672  1.80703 -1.56612 -1.48714  0.94881  0.49207
TCGA.02.0021.01  1.61471 -1.50998  1.68084  1.94643  0.69170  0.79564
TCGA.02.0024.01 -1.62924  2.32561 -0.88169 -1.38952 -0.30963  0.64653

> table(rownames(mrna) %in% rownames(mrna_ueArray))

FALSE  TRUE #There are 107 patients overlapping between the two expression datasets
  107    47 
```


## Protein Expression Data

```R
> prot <- matrices(dz)$mtx.prot
> dim(prot)
[1] 214 171
> prot[c(1:10), c(53,54,55,56,141,110, 168)]
               EGFR-R-C EGFR_pY1068-R-V EGFR_pY1173-R-C EGFR_pY992-R-V
TCGA.02.0003 -1.1448860     -0.97032203     -0.55116022   -0.981332851
TCGA.02.0004 -0.8788662     -0.89093273     -0.30619305   -0.896262630
TCGA.02.0011 -0.6813241     -0.01430349     -0.40735789   -0.341739894
TCGA.02.0014 -1.0575641     -0.60484802     -0.61024289    0.188828520
TCGA.02.0068 -0.9876569     -0.60366569     -0.74691266   -0.790809930
TCGA.02.0069 -0.9783135     -0.76765246     -0.66951716    0.006548698
TCGA.02.0116 -0.1669634      0.08162206     -0.33343515    0.978812874
TCGA.02.2470 -0.9978155     -0.70780206     -0.08883589    0.084623552
TCGA.02.2485  1.5386868      1.00673045      0.76348417    0.864611688
TCGA.06.0125  0.9290328      0.48979561      0.29574320    0.080075827
             VEGFR2-R-C   PTEN-R-V     p53-R-V
TCGA.02.0003  1.1057706  0.6648982  0.04813986
TCGA.02.0004  0.8311737 -1.4479134 -0.04693505
TCGA.02.0011 -1.1156879  0.4819067  0.38073400
TCGA.02.0014 -1.0917743  0.1249528 -0.45095659
TCGA.02.0068  1.3738875  0.1524966  0.02748055
TCGA.02.0069  2.1277449  0.2083672 -0.04432054
TCGA.02.0116 -1.7190042 -1.9243557  2.64672677
TCGA.02.2470 -1.9757657 -1.8878893  0.26570687
TCGA.02.2485 -0.9737182 -0.4021184  0.95267454
TCGA.06.0125  0.8663092 -0.8788458  0.01435868
```


