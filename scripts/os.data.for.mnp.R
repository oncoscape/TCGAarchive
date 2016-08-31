###
#       
###

# Library Imports ---------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

source("common.R")

# Configuration -----------------------------------------------------------

date <- as.character(Sys.Date())
scaleFactor = 10000

args = commandArgs(trailingOnly=TRUE)
if(length(args) != 0)
	commands <- args

#----------------------------------------------------------------------------------------------------
os.save.ptLayouts <- function(mds_colls, scaleFactor=100000){

	datatypeName= "cluster"
	
	for(collection in mds_colls){
	  scale <- collection$process[[1]]$scale
	  if(is.null(scale) || scale != scaleFactor) next;
	  data_coll <- mongo.find.all(mongo, paste(db, collection$collection, sep="."))[[1]]
	  data_coll$source <- collection$source
    if(length(data_coll)==0){
      print(paste("ERROR: collection not found - ", collection$collection, sep=""))
      next;
    }
	   mongo.insert(mongo, paste(db, "render_patient", sep="."), data_coll)
	}
	
	
	cat_colls <- mongo.find.all(mongo, paste(db, "manifest", sep="."), query=list(dataType="color"))
	
	for(collection in cat_colls){
	  data_coll <- mongo.find.one(mongo, paste(db, collection$collection, sep="."))
	  if(length(data_coll)==0){
	    print(paste("ERROR: collection not found - ", collection$collection, sep=""))
	    next;
	  }
	  mongo.insert(mongo, paste(db, "render_patient",sep="."), data_coll)
	}
	
}

##----------------------------
os.copy.chromosome.layout <- function(scaleFactor=100000){
  
  datatypeName= "cluster"
  collection <- mongo.find.all(mongo, paste(db, "manifest",sep="."), 
                              query=list(dataset="hg19", dataType="chromosome"))
  scaled <- which(sapply(collection, function(coll){ 
    if(coll$process == "length") return(FALSE)
    coll$process$scale==scaleFactor}))
  
  data_coll <- mongo.find.one(mongo, paste(db, collection[[scaled]]$collection, sep="."))
  mongo.insert(mongo, "oncoscape.render_chromosome", data_coll)

  genesets <- mongo.find.all(mongo, paste(db, "manifest",sep="."), 
                               query=list(dataset="hg19", dataType="genesets", process=list(scale=scaleFactor)))[[1]]
  geneset_coll <- mongo.find.all(mongo, paste(db, genesets$collection, sep="."))
  
  for(collection in geneset_coll){
    mongo.insert(mongo, paste(db, "render_chromosome",sep="."), collection)
  }
}
#----------------------------------------------------------------------------------------------------
os.save.pca <- function(scaleFactor=NA){
  
  datatypeName= "cluster"
  pca_colls <- mongo.find.all(mongo, paste(db, "manifest",sep="."), 
                              query=list(dataType="pcaScores"))
  
  for(collection in pca_colls){
    scale <- collection$process$scale
    if(is.na(scaleFactor)){
      if(is.null(scale)){
        data_coll <- mongo.find.all(mongo, paste(db, collection$collection, sep="."))[[1]]
        data_coll$source <- collection$source
        mongo.insert(mongo, paste(db, "render_pca",sep="."), data_coll)
      }
      next;
    }
    if(is.null(scale) ||is.na(scale) || scale != scaleFactor) next;
    data_coll <- mongo.find.all(mongo, paste(db, collection$collection, sep="."))[[1]]
    data_coll$source <- collection$source
    mongo.insert(mongo, paste(db, "render_pca",sep="."), data_coll)
  }
}

##----------------------------
#commands <- c("patient", "pca", "chromosome")
commands <- c("pca", "patient")

mongo <- connect.to.mongo()

if("patient" %in% commands){
#  mds_colls <- mongo.find.all(mongo, paste(db, "manifest", sep="."), query=list(dataType="mds", source="ucsc-HoBo"))
   mds_colls <- mongo.find.all(mongo, paste(db, "manifest", sep="."), query=list(dataType="mds"))
  os.save.ptLayouts(mds_colls, scaleFactor=100000) 
}
 
if("chromosome" %in% commands) 
  os.copy.chromosome.layout(scaleFactor=100000)

if("pca" %in% commands) 
  os.save.pca()

close.mongo(mongo)