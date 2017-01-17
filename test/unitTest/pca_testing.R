source("../scripts/common.R")
source("../scripts/networks.calculate.mds.edges.R")
db <- "tcga"
user="oncoscape"
password = Sys.getenv("dev_oncoscape_pw")
            host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")
 
mongo <- connect.to.mongo()
## creates mongo.manifest and mongo.lookup connections
 
## Example queries
#   lgg_mut = mongo.manifest$find(toJSON(list(collection="tcga_lgg_mutation_broad_ucsc-xena"), auto_unbox = T))
#   con <- mongo("lookup_dataTypes", db=db, url=host)
#   dataTypes_mol = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class": {"$in":["cnv_thd", "mut", "mut01"]}}]}')
# rm(con)

## Obtain pca score and loading
acc_cluster = mongo("acc_cluster", db=db, url=host)
acc_cluster_pca = acc_cluster$find(toJSON(list(dataType="PCA"), auto_unbox = T))
# length(acc_cluster_pca) #12
# str(acc_cluster_pca,max.level=1)

## Obtain raw data 
# from lgg_cluster document: geneset, dataType, input, source 
# from manifest: manifest process' geneset, dataType, input, source
# from lookup_oncoscape_datasources disease molecular array, source, type (input) and locate the collection name