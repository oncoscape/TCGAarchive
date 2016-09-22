
# DataBase Description

We use two collections to track the meta information. 'manifest' is organized by collection. 'lookup_oncoscape_datasource' is organized by disease.

## From Disease Perspective

Key words to describe lookup_oncoscape_datasource collection

Key | Annotation
--------- | ----------- 
disease | disease code used in Oncoscape naming system
source | data source
beta | For a specific dataset, if the beta value is true, this dataset is currently only alive in the developmental environment and won't be included in the production version of Oncoscape application.
name | disease name
img | images utilized for Oncoscape application
clinical | clinic-related collections
category | geneset and coloring collections utilized by Oncoscape application
molecular | molecular collections
calculated | derived colletions for PCA (one of the Oncoscape tools) and Multidimensional scaling
edges | derived colecitons for Markers and Patient (one of the Oncoscape tools)
type | all possible data type for each collection

### Disease List

Disease Code | Disease Name
--------- | ----------- 
brain | Brain
brca | Breast
esca | Esophageal
gbm | Glioblastoma
hnsc | Head and Neck
kich | Kidney chromophobe
kirc | Kidney renal clear cell
kirp | Kidney renal papillary cell
lgg | Lower grade glioma
lihc | Liver
luad | Lung adenocarcinoma
lusc | Lung squamous cell
sarc | Sarcoma
paad | Pancreas
prad | Prostate
skcm | Skin cutaneous melanoma
stad | Stomach
thca | Thyroid carcinoma
ucec | Uterine corpus endometrial
acc | Adrenocortical carcinoma
blca | Bladder urothelial carcinoma
cesc | Cervical
chol | Cholangiocarcinoma
dlbc | Diffuse large B-cell
coadread | Colorectal
lung | Lung
coad | Colon
hg19 | hg19
laml | Acute Myeloid Leukemia
read | Rectal
ucs | Uterine carcinosarcoma
uvm | Uveal melanoma
thym | Thymoma
tgct | Testicular germ cell
pcpg | Pheochromocytoma & Paraganglioma
ov | Ovarian
meso | Mesothelioma

### source

<a href='https://gdc.cancer.gov/'>TCGA</a>

### clinical

Key words to describe clinical collections for each disease type

clinical collection type | Annotation
--------- | ----------- 
events | clinical events collection organized by patient
patient | patient collection for each disease type
drug | chemo or other medicine administration records
newTumor | new tumor event records for possible patients
otherMalignancy | other maliganancy records for possible patients
radiation | radiation administration records
followUp | possible follow-up records
newTumor-followUp | possible follow-up records for the new tumor events

### molecular

molecular collection source | Annotation
--------- | ----------- 
broad | <a href='https://gdac.broadinstitute.org//'>Broad Firehose</a>
cBio | <a href='http://www.cbioportal.org/'>cBioPortal</a>
ucsc-PNAS | <a href='http://www.pnas.org/content/113/19/5394.full/'>Publication</a>
ucsc | <a href='https://genome-cancer.ucsc.edu/'>UCSC</a>
bradleyLab | <a href='www.fredhutch.org/en/labs/labs-import/bradley-lab.html/'>Bradley Lab</a>
demo | <a href='oncoscape.sttrcancer.org/'>Demo data source</a>

molecular collection type | Annotation
--------- | ----------- 
mut | non-synonymous mutations representated as strings in this collection
mut01 | non-synonymous mutations representated as binary values in this collection
methylation | DNA methlyation data
cnv | DNA copy-number data represented as Gistic score
psi | percentage spliced in (PSI, Ψ) values in RNA splicing data
rna | mRNA and microRNA expression data
protein | protein-level and phosphoprotein level (RPPA) data
facs | Fluorescence-activated cell sorting data

### category

category collection source | Annotation
--------- | ----------- 
tcga | <a href='https://gdc.cancer.gov/'>TCGA</a>
hgnc | <a href='http://www.genenames.org/'>HUGO Gene Nomenclature Committee</a>
orgHs | <a href='https://bioconductor.org/packages/release/data/annotation/html/org.Hs.eg.db.html/'>Genome wide annotation for Human</a>

category collection type | Annotation
--------- | ----------- 
color | a collection for coloring in Oncoscape application
genesets | a collection of multiple genesets with specific genes in each set

### calculated

calculated collection source | Annotation
--------- | ----------- 
ucsc | <a href='https://genome-cancer.ucsc.edu/'>UCSC</a>
broad | <a href='https://gdac.broadinstitute.org//'>Broad Firehose</a>

calculated collection type | Annotation
--------- | ----------- 
pcaScores | calculated PCA scores for a specific data with specific genesets
pcaLoadings | pre-calculated PCA scores for a specific data with specific genesets
mds | Multidimensional Scaling data for a specific data with specific genesets

### edges

edges names are collections of genesets: 

edges geneset | geneset information
--------- | ----------- 
TCGA GBM classifiers | hg19_genesets_hgnc_import[0]
Marker genes 545 | hg19_genesets_hgnc_import[1]
TCGA pancan mutated | hg19_genesets_hgnc_import[2]
oncoVogel274 | hg19_genesets_hgnc_import[3]
Oncoplex | hg19_genesets_hgnc_import[4]
OSCC Chen 131 probes | hg19_genesets_hgnc_import[5]
OSCC Chen 9 genes | hg19_genesets_hgnc_import[6]

edges collection source | Annotation
--------- | ----------- 
broad | <a href='https://gdac.broadinstitute.org//'>Broad Firehose</a>
ucsc | <a href='https://genome-cancer.ucsc.edu/'>UCSC</a>

## From Collection Perspective

### Manifest Dataset
brain
brca
esca
gbm
hnsc
kich
KIRC
kirp
lgg
lihc
luad
lusc
sarc
paad
prad
skcm
stad
thca
ucec
acc
blca
cesc
chol
dlbc
coadread
lung
coad
hg19
laml
read
ucs
uvm
thym
tgct
pcpg
ov
meso
kirc
