options(stringsAsFactors=F)
vega <- read.csv("martquery_1108231605_14.txt", head=TRUE, sep=",")
dim(vega)
#[1] 199362     15
noHGNC <- read.csv("noHGNC.csv", head=TRUE)
dim(noHGNC)
noHGNC <- read.csv("noHGNC.csv", head=TRUE)
head(vega$Associated.Gene.Name)
table(noHGNC$geneID %in% vega$Associated.Gene.Name)
# table(noHGNC$geneID %in% vega$Associated.Gene.Name)
# FALSE  TRUE 
#  7116  4967 
noHGNCNoVega = noHGNC$geneID[which(!(noHGNC$geneID %in% vega$Associated.Gene.Name))]
write.csv(noHGNCNoVega, file="noHGNCNoVega.csv")

