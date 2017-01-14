source("../scripts/common.R")
 
db <- "tcga"
user="oncoscape"
password = Sys.getenv("dev_oncoscape_pw")
            host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")
 
mongo <- connect.to.mongo()
## creates mongo.manifest and mongo.lookup connections
 
## Example queries
  lgg_mut = mongo.manifest$find(toJSON(list(collection="tcga_lgg_mutation_broad_ucsc-xena"), auto_unbox = T))
  con <- mongo("lookup_dataTypes", db=db, url=host)
  dataTypes_mol = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class": {"$in":["cnv_thd", "mut", "mut01"]}}]}')
rm(con)

