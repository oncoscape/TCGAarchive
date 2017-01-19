library(RCurl)
library(RUnit)
source("common.R")
source("bindToEnv.R")
source("../../scripts/networks.calculate.mds.edges.R")
db <- "tcga"
mongo <- connect.to.mongo()

con <- mongo("lookup_genesets", db=db, url=host)
lookup_genesets = con$find()

f = CFILE("mds/brca_cnvthd.txt", mode="wb")
curlPerform(url="https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/Gistic2_CopyNumber_Gistic2_all_thresholded.by_genes", writedata=f@ref)
close(f)
options(stringsAsFactors=FALSE)
brca_cnvthd = read.delim("mds/brca_cnvthd.txt") 
rownames(brca_cnvthd) <- brca_cnvthd[,1]
brca_cnvthd <- brca_cnvthd[,c(-1)]

f = CFILE("mds/brca_mut.txt", mode="wb")
curlPerform(url="https://tcga.xenahubs.net/download/TCGA.BRCA.sampleMap/mutation_curated_wustl_gene", writedata=f@ref)
close(f)
brca_mut = read.delim("mds/brca_mut.txt") 
rownames_brca_mut <- brca_mut[,1]
brca_mut <- brca_mut[,c(-1)]

brca_mds = calculate.mds.innerProduct(brca_cnvthd, brca_mut, genes=NA, regex = NA, threshold = NA)
cor(brca_mds$scores[,1], brca_mds$scores[,2]) #  -6.022768e-17


con <- mongo("brca_cluster", db=db, url=host)
brca_cluster_mds_1 <- con$find()
clusterMds = brca_cluster_mds_1[which(brca_cluster_mds_1$dataType=="MDS")[1],"scores"][[1]]
V1=c()
V2=c()
for(i in 1:nrow(clusterMds)){
	V1=c(V1,clusterMds[i,2][[1]][1])
	V2=c(V2,clusterMds[i,2][[1]][2])
}
cor(V1, V2) #[1] -8.880102e-05
cl = data.frame(cV1=V1, cV2=V2)
cor(brca_mds$scores[,c(1,2)], cl)
           cV1        cV2
V1  0.02981795 0.03137283
V2 -0.01626605 0.00849144
