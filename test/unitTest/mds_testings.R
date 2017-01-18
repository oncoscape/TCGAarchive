library(RCurl)
library(RUnit)
source("common.R")
source("bindToEnv.R")
source("../../scripts/networks.calculate.mds.edges.R")
db <- "tcga"
mongo <- connect.to.mongo()

con <- mongo("lookup_genesets", db=db, url=host)
lookup_genesets = con$find()
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

