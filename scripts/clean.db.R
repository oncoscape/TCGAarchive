# Configuration -----------------------------------------------------------
#rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

source("common.R")

#-------------------------------------------------------
remove_samplemap <- function(dataset){
  samplemap <- mongo.manifest$distinct("collection", toJSON(list(dataset=dataset, dataType="samplemap"), auto_unbox = T))
  rem_samplemap <- samplemap[!grepl("samplemap$", samplemap)]
  remove.collections.by.name(rem_samplemap)
}
#-------------------------------------------------------
remove_oldnetwork <- function(dataset){
  edges <- mongo.manifest$distinct("collection", toJSON(list(dataset=dataset, dataType="edges"), auto_unbox=T))
  ptdegree <- mongo.manifest$distinct("collection", toJSON(list(dataset=dataset, dataType="ptdegree"), auto_unbox=T))
  genedegree <- mongo.manifest$distinct("collection", toJSON(list(dataset=dataset, dataType="genedegree"), auto_unbox=T))
  remove.collections.by.name(c(edges,ptdegree,genedegree))
  
  edges <- mongo.lookup$distinct("edges", toJSON(list(disease=dataset), auto_unbox=T))
  edges_keep <- subset(edges, source == "ucsc xena")
  keep <- sapply(edges_keep$dataType, function(dtype) length(unlist(dtype)) == 1)
  edges_keep <- edges_keep[keep,]
  # update edges regardless to remove duplicate edges (from multiple CNV alteration types)
  mongo.lookup$update(toJSON(list(disease=dataset), auto_unbox = T),
                      toJSON(list("$set"=list(edges=edges_keep)), auto_unbox=T))
  
}
#-------------------------------------------------------
remove_oldmolecular <- function(dataset){
  molecular <- mongo.lookup$distinct("molecular", toJSON(list(disease=dataset), auto_unbox=T))
  molecular_keep <- subset(molecular, source == "ucsc xena")
  if(nrow(molecular) != nrow(molecular_keep)){
    mongo.lookup$update(toJSON(list(disease=dataset), auto_unbox = T),
                        toJSON(list("$set"=list(molecular=molecular_keep)), auto_unbox=T))
  }
}
#-------------------------------------------------------
remove_oldcalculated <- function(dataset){
  calculated <- mongo.lookup$distinct("calculated", toJSON(list(disease=dataset), auto_unbox=T))
  calculated_keep <- subset(calculated, type %in% c("PCA", "MDS"))
  if(nrow(calculated) != nrow(calculated_keep)){
    mongo.lookup$update(toJSON(list(disease=dataset), auto_unbox = T),
                        toJSON(list("$set"=list(calculated=calculated_keep)), auto_unbox=T))
  }
}
#-------------------------------------------------------
clean_clinicallookup <- function(dataset){
  
  #clin <- mongo.lookup$distinct("clinical",toJSON(list(disease=dataset), auto_unbox = T))
  mongo.lookup$update(toJSON(list(disease=dataset), auto_unbox = T), '{$set: {"clinical":{}}}')
  
}


# Run Block  -------------------------------------------------------

os.clean.database <- function(datasets=NA){

	for(dataset in datasets){
	  print(dataset)
	  
		
	}
}






# Run Block  -------------------------------------------------------

## if running off local db, must first initialize server (through shell >mongod)
mongo <- connect.to.mongo()

commands <- "clean"
## TO DO: sample should be run once gene vs chr position collections decided

args = commandArgs(trailingOnly=TRUE)
if(length(args) != 0 )
  commands <- args

if("clean" %in% commands) {
	#datasets = c("brain", "lung", "hnsc", "brca", "luad", "lusc", "prad", "gbm", "lgg")
  datasets = mongo.lookup$distinct("disease")
  datasets = setdiff(datasets, c("hg19"))
  os.clean.database( datasets=datasets)
}

close.mongo()
