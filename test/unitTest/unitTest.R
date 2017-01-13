source("common.R")  
db <- "tcga"
host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")
mongo <- connect.to.mongo()
