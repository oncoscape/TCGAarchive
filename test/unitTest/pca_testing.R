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

rm(con)

 