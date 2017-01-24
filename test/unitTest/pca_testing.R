library(RCurl)
library(RUnit)
source("common.R")
source("bindToEnv.R")
source("../../scripts/networks.calculate.mds.edges.R")
db <- "tcga"

mongo <- connect.to.mongo()
## creates mongo.manifest and mongo.lookup connections
 
## Example queries
#   lgg_mut = mongo.manifest$find(toJSON(list(collection="tcga_lgg_mutation_broad_ucsc-xena"), auto_unbox = T))
#   con <- mongo("lookup_dataTypes", db=db, url=host)
#   dataTypes_mol = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class": {"$in":["cnv_thd", "mut", "mut01"]}}]}')
# rm(con)

## Obtain manifest and lookup
# con <- mongo("manifest", db=db, url=host)
# manifest = con$find()
# con <- mongo("lookup_oncoscape_datasources", db=db, url=host)
# lookup_oncoscape_datasources = con$find()
con <- mongo("lookup_genesets", db=db, url=host)
lookup_genesets = con$find()
rm(con)

# lookup_genesets[,1]
# [1] "TCGA GBM Classifiers"    "Glioma Markers"         
# [3] "TCGA Pancan Mutated"     "Oncoplex Vogelstein"    
# [5] "Oncoplex"                "OSCC Expression Markers"

## Obtain pca score and loading
# brca_cluster = mongo("brca_cluster", db=db, url=host)
# brca_cluster_pca = brca_cluster$find(toJSON(list(dataType="PCA"), auto_unbox = T))
# length(brca_cluster_pca) #12
# str(brca_cluster_pca, max.level=1)

## Obtain raw data 
# from brca_cluster document: geneset, dataType, input, source 
# from manifest: manifest process' geneset, dataType, input, source
# from lookup_oncoscape_datasources disease molecular array, source, type (input) and locate the collection name

## unit test
# 2 diseases: brca
# RNASeq and RPPA
# All genesets

## check: 
# - plot visual
# - variances
# - scores point checking
# - loading point checking

### Brca RPPA
#https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/RPPA_RBN.json
#library(ggfortify)
f = CFILE("pca/brca_rppa.txt", mode="wb")
curlPerform(url="https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/RPPA_RBN", writedata=f@ref)
close(f)
options(stringsAsFactors=FALSE)
brca_rppa = read.table("pca/brca_rppa.txt", header=TRUE, sep="") 
rownames(brca_rppa) <- brca_rppa[,1]
brca_rppa <- brca_rppa[,c(-1)]
brca_rppa_pca <- calculate.pca(t(brca_rppa), genes=NA)
pdf(file="pca/brca_rppa_pca.pdf")
plot(brca_rppa_pca$scores)
dev.off()
sc = brca_rppa_pca
checkEquals(dim(sc$scores), c(747, 131))
checkEquals(sc$variance[c(1,2)], c(16.31, 8.71))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("ASNS", "AKTPS473", "CYCLINB1"))


brca_rppa_pca_tcgagbmclassifier = calculate.pca(t(brca_rppa), genes=lookup_genesets[1,2])
sc = brca_rppa_pca_tcgagbmclassifier
checkEquals(sc$reason, "WARNING: mtx does not match gene/patient set.")



brca_rppa_pca_gliomamarkers = calculate.pca(t(brca_rppa), genes=lookup_genesets[2,2])
pdf(file="pca/brca_rppa_pca_gliomamarkers.pdf")
plot(brca_rppa_pca_gliomamarkers$scores)
dev.off()
sc = brca_rppa_pca_gliomamarkers
checkEquals(dim(sc$scores), c(747, 10))
checkEquals(sc$variance[c(1,2)], c(29.59, 20.32))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c( "IRS1","SYK","ATM" ))


brca_rppa_pca_tcgapancanmutated = calculate.pca(t(brca_rppa), genes=lookup_genesets[3,2])
pdf(file="pca/brca_rppa_pca_tcgapancanmutated.pdf")
plot(brca_rppa_pca_tcgapancanmutated$scores)
dev.off()
sc = brca_rppa_pca_tcgapancanmutated
checkEquals(dim(sc$scores), c(747, 6))
checkEquals(sc$variance[c(1,2)], c(41.90, 18.02))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("ATM", "PTEN", "SMAD4"))


brca_rppa_pca_oncoplexvogelstein = calculate.pca(t(brca_rppa), genes=lookup_genesets[4,2])
pdf(file="pca/brca_rppa_pca_oncoplexvogelstein.pdf")
plot(brca_rppa_pca_oncoplexvogelstein$scores)
dev.off()
sc = brca_rppa_pca_oncoplexvogelstein
checkEquals(dim(sc$scores), c(747, 12))
checkEquals(sc$variance[c(1,2)], c(26.86, 14.59))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("NF2", "SMAD3", "SMAD4"))


brca_rppa_pca_oncoplex = calculate.pca(t(brca_rppa), genes=lookup_genesets[5,2])
pdf(file="pca/brca_rppa_pca_oncoplex.pdf")
plot(brca_rppa_pca_oncoplex$scores)
dev.off()
sc = brca_rppa_pca_oncoplex
checkEquals(dim(sc$scores), c(747, 13))
checkEquals(sc$variance[c(1,2)], c(26.55, 14.09))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("NF2", "SMAD3", "BCL2"))


brca_rppa_pca_osccexpressionmarkers = calculate.pca(t(brca_rppa), genes=lookup_genesets[6,2])
sc = brca_rppa_pca_osccexpressionmarkers
checkEquals(sc$reason, "WARNING: mtx does not match gene/patient set.")



### Brca RNASeq
f = CFILE("pca/brca_rnaseq.txt", mode="wb")
curlPerform(url="https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/HiSeqV2", writedata=f@ref)
close(f)
#https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/HiSeqV2.json
brca_rnaseq = read.table("pca/brca_rnaseq.txt", header=TRUE, sep="") 
rownames(brca_rnaseq) <- brca_rnaseq[,1]
brca_rnaseq <- brca_rnaseq[,c(-1)]
brca_rnaseq_pca <- calculate.pca(t(brca_rnaseq), genes=NA)
pdf(file="pca/brca_rnaseq_pca.pdf")
plot(brca_rnaseq_pca$scores)
dev.off()
sc = brca_rnaseq_pca
checkEquals(dim(sc$scores), c(1218, 1218))
checkEquals(sc$variance[c(1,2)], c(11.31, 7.83))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("CIRBP", "SUV39H2", "SRPK1"))


brca_rnaseq_pca_tcgagbmclassifier = calculate.pca(t(brca_rnaseq), genes=lookup_genesets[1,2])
sc = brca_rnaseq_pca_tcgagbmclassifier
pdf(file="pca/brca_rnaseq_pca_tcgagbmclassifier.pdf")
plot(brca_rnaseq_pca_tcgagbmclassifier$scores)
dev.off()
checkEquals(dim(sc$scores), c(1218, 794))
checkEquals(sc$variance[c(1,2)], c(13.18, 11.18))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("E2F3", "MCM10", "BLM"))



brca_rnaseq_pca_gliomamarkers = calculate.pca(t(brca_rnaseq), genes=lookup_genesets[2,2])
pdf(file="pca/brca_rnaseq_pca_gliomamarkers.pdf")
plot(brca_rnaseq_pca_gliomamarkers$scores)
dev.off()
sc = brca_rnaseq_pca_gliomamarkers
checkEquals(dim(sc$scores), c(1218, 521))
checkEquals(sc$variance[c(1,2)], c(13.92, 9.61))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("STIL", "GMPS", "CCNE1"))


brca_rnaseq_pca_tcgapancanmutated = calculate.pca(t(brca_rnaseq), genes=lookup_genesets[3,2])
pdf(file="pca/brca_rnaseq_pca_tcgapancanmutated.pdf")
plot(brca_rnaseq_pca_tcgapancanmutated$scores)
dev.off()
sc = brca_rnaseq_pca_tcgapancanmutated
checkEquals(dim(sc$scores), c(1218, 73))
checkEquals(sc$variance[c(1,2)], c(24.88, 8.54))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("GATA3", "NUMA1", "BRCA2"))


brca_rnaseq_pca_oncoplexvogelstein = calculate.pca(t(brca_rnaseq), genes=lookup_genesets[4,2])
pdf(file="pca/brca_rnaseq_pca_oncoplexvogelstein.pdf")
plot(brca_rnaseq_pca_oncoplexvogelstein$scores)
dev.off()
sc = brca_rnaseq_pca_oncoplexvogelstein
checkEquals(dim(sc$scores), c(747, 12))
checkEquals(sc$variance[c(1,2)], c(1218, 272))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("ESR1","BRIP1","GATA3"))


brca_rnaseq_pca_oncoplex = calculate.pca(t(brca_rnaseq), genes=lookup_genesets[5,2])
pdf(file="pca/brca_rnaseq_pca_oncoplex.pdf")
plot(brca_rnaseq_pca_oncoplex$scores)
dev.off()
sc = brca_rnaseq_pca_oncoplex
checkEquals(dim(sc$scores), c(1218, 258))
checkEquals(sc$variance[c(1,2)], c(16.45, 10.36))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("EPHB6", "MSH2" , "MSH6" ))


brca_rnaseq_pca_osccexpressionmarkers = calculate.pca(t(brca_rnaseq), genes=lookup_genesets[6,2])
pdf(file="pca/brca_rnaseq_pca_osccexpressionmarkers.pdf")
plot(brca_rnaseq_pca_osccexpressionmarkers$scores)
dev.off()
sc = brca_rnaseq_pca_osccexpressionmarkers
checkEquals(dim(sc$scores), c(1218, 102))
checkEquals(sc$variance[c(1,2)], c(16.84, 12.61))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("MYH11", "TNXB", "PGM5" ))

### GBM 
f = CFILE("pca/gbm_rppa.txt", mode="wb")
curlPerform(url="https://tcga.xenahubs.net/download/TCGA.GBM.sampleMap/RPPA_RBN", writedata=f@ref)
close(f)
gbm_rppa = read.table("pca/gbm_rppa.txt", header=TRUE, sep="") 
rownames(gbm_rppa) <- gbm_rppa[,1]
gbm_rppa <- gbm_rppa[,c(-1)]
gbm_rppa_pca <- calculate.pca(t(gbm_rppa), genes=NA)
pdf(file="pca/gbm_rppa_pca.pdf")
plot(gbm_rppa_pca$scores)
dev.off()
sc = gbm_rppa_pca
checkEquals(dim(sc$scores), c(215, 131))
checkEquals(sc$variance[c(1,2)], c(22.63, 9.46))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("MEK1", "S6", "JNKPT183Y185"))

gbm_rppa_pca_tcgagbmclassifier = calculate.pca(t(gbm_rppa), genes=lookup_genesets[1,2])
sc = brca_rppa_pca_tcgagbmclassifier
checkEquals(sc$reason, "WARNING: mtx does not match gene/patient set.")



gbm_rppa_pca_gliomamarkers = calculate.pca(t(gbm_rppa), genes=lookup_genesets[2,2])
pdf(file="pca/gbm_rppa_pca_gliomamarkers.pdf")
plot(gbm_rppa_pca_gliomamarkers$scores)
dev.off()
sc = gbm_rppa_pca_gliomamarkers
checkEquals(dim(sc$scores), c(215, 10))
checkEquals(sc$variance[c(1,2)], c(31.62, 16.63))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("ASNS", "EGFR", "SYK"))


gbm_rppa_pca_tcgapancanmutated = calculate.pca(t(gbm_rppa), genes=lookup_genesets[3,2])
pdf(file="pca/gbm_rppa_pca_tcgapancanmutated.pdf")
plot(gbm_rppa_pca_tcgapancanmutated$scores)
dev.off()
sc = gbm_rppa_pca_tcgapancanmutated
checkEquals(dim(sc$scores), c(215, 6))
checkEquals(sc$variance[c(1,2)], c(41.85, 19.54))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("PTEN", "EGFR", "NOTCH1"))


gbm_rppa_pca_oncoplexvogelstein = calculate.pca(t(gbm_rppa), genes=lookup_genesets[4,2])
pdf(file="pca/gbm_rppa_pca_oncoplexvogelstein.pdf")
plot(gbm_rppa_pca_oncoplexvogelstein$scores)
dev.off()
sc = gbm_rppa_pca_oncoplexvogelstein
checkEquals(dim(sc$scores), c(215, 12))
checkEquals(sc$variance[c(1,2)], c(26.44, 15.29))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("NF2", "SMAD4", "EGFR"))


gbm_rppa_pca_oncoplex = calculate.pca(t(gbm_rppa), genes=lookup_genesets[5,2])
pdf(file="pca/gbm_rppa_pca_oncoplex.pdf")
plot(gbm_rppa_pca_oncoplex$scores)
dev.off()
sc = gbm_rppa_pca_oncoplex
checkEquals(dim(sc$scores), c(215, 13))
checkEquals(sc$variance[c(1,2)], c(28.10, 14.63))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("EGFR", "SRC", "AR"))


gbm_rppa_pca_osccexpressionmarkers = calculate.pca(t(gbm_rppa), genes=lookup_genesets[6,2])
sc = brca_rppa_pca_osccexpressionmarkers
checkEquals(sc$reason, "WARNING: mtx does not match gene/patient set.")

f = CFILE("pca/gbm_rnaseq.txt", mode="wb")
curlPerform(url="https://tcga.xenahubs.net/download/TCGA.GBM.sampleMap/HiSeqV2", writedata=f@ref)
close(f)
#https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/HiSeqV2.json
gbm_rnaseq = read.table("pca/gbm_rnaseq.txt", header=TRUE, sep="") 
rownames(gbm_rnaseq) <- gbm_rnaseq[,1]
gbm_rnaseq <- gbm_rnaseq[,c(-1)]
gbm_rnaseq_pca <- calculate.pca(t(gbm_rnaseq), genes=NA)
sc = gbm_rnaseq_pca
pdf(file="pca/gbm_rnaseq_pca.pdf")
plot(gbm_rnaseq_pca$scores)
dev.off()
checkEquals(dim(sc$scores), c(172, 172))
checkEquals(sc$variance[c(1,2)], c(12.78, 7.98))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("PTBP1","VDR", "GPR132"))


gbm_rnaseq_pca_tcgagbmclassifier = calculate.pca(t(gbm_rnaseq), genes=lookup_genesets[1,2])
sc = gbm_rnaseq_pca_tcgagbmclassifier
pdf(file="pca/gbm_rnaseq_pca_tcgagbmclassifier.pdf")
plot(gbm_rnaseq_pca_tcgagbmclassifier$scores)
dev.off()
checkEquals(dim(sc$scores), c(172, 172))
checkEquals(sc$variance[c(1,2)], c(23.16, 15.90))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("EPB41L3", "GATAD2A", "YPEL5"))



gbm_rnaseq_pca_gliomamarkers = calculate.pca(t(gbm_rnaseq), genes=lookup_genesets[2,2])
pdf(file="pca/gbm_rnaseq_pca_gliomamarkers.pdf")
plot(gbm_rnaseq_pca_gliomamarkers$scores)
dev.off()
sc = gbm_rnaseq_pca_gliomamarkers
checkEquals(dim(sc$scores), c(172, 172))
checkEquals(sc$variance[c(1,2)], c(13.63, 9.71))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("NFKB1", "EZH2", "FANCD2"))


gbm_rnaseq_pca_tcgapancanmutated = calculate.pca(t(gbm_rnaseq), genes=lookup_genesets[3,2])
pdf(file="pca/gbm_rnaseq_pca_tcgapancanmutated.pdf")
plot(gbm_rnaseq_pca_tcgapancanmutated$scores)
dev.off()
sc = gbm_rnaseq_pca_tcgapancanmutated
checkEquals(dim(sc$scores), c(172, 73))
checkEquals(sc$variance[c(1,2)], c(19.86, 11.56))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("STK11", "AKT1", "TBL1XR1"))


gbm_rnaseq_pca_oncoplexvogelstein = calculate.pca(t(gbm_rnaseq), genes=lookup_genesets[4,2])
pdf(file="pca/gbm_rnaseq_pca_oncoplexvogelstein.pdf")
plot(gbm_rnaseq_pca_oncoplexvogelstein$scores)
dev.off()
sc = gbm_rnaseq_pca_oncoplexvogelstein
checkEquals(dim(sc$scores), c(172, 172))
checkEquals(sc$variance[c(1,2)], c(15.99, 11.75))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("TGFBR2", "TNFAIP3", "PRDM1" ))


gbm_rnaseq_pca_oncoplex = calculate.pca(t(gbm_rnaseq), genes=lookup_genesets[5,2])
pdf(file="pca/gbm_rnaseq_pca_oncoplex.pdf")
plot(gbm_rnaseq_pca_oncoplex$scores)
dev.off()
sc = gbm_rnaseq_pca_oncoplex
checkEquals(dim(sc$scores), c(172, 172))
checkEquals(sc$variance[c(1,2)], c(15.75, 11.90))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("TGFBR2", "RUNX1", "ETV6" ))


gbm_rnaseq_pca_osccexpressionmarkers = calculate.pca(t(gbm_rnaseq), genes=lookup_genesets[6,2])
pdf(file="pca/gbm_rnaseq_pca_osccexpressionmarkers.pdf")
plot(gbm_rnaseq_pca_osccexpressionmarkers$scores)
dev.off()
sc = gbm_rnaseq_pca_osccexpressionmarkers
checkEquals(dim(sc$scores), c(172, 101))
checkEquals(sc$variance[c(1,2)], c(17.64, 11.66))
l = sc$loading[,c(1:3)]
h = head(sort(apply(abs(l),1,max),decreasing = T), n=3)
checkEquals(names(h), c("IFI6", "ISG15", "USP18"))




